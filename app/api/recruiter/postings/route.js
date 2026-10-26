// app/api/recruiter/postings/route.js
import { NextResponse } from 'next/server';
const { query, withTransaction } = require('../../../../lib/db');
const { requireAuth } = require('../../../../lib/auth');
const { generateEmbedding, vectorToSql } = require('../../../../lib/embeddings');
const { getMongoDb } = require('../../../../lib/mongo');

export async function GET(request) {
  try {
    const user = requireAuth(request, ['recruiter', 'admin']);
    let companyId;

    if (user.role === 'recruiter') {
      const recRes = await query('SELECT company_id FROM recruiter WHERE user_id = $1', [user.userId]);
      companyId = recRes.rows[0].company_id;
    } else {
      const { searchParams } = new URL(request.url);
      companyId = searchParams.get('companyId');
    }

    let sql = `
      SELECT 
        p.posting_id,
        p.title,
        p.description,
        p.location,
        p.mode,
        p.stipend,
        p.openings,
        p.filled,
        p.deadline,
        p.start_date,
        p.duration_weeks,
        p.min_cgpa,
        p.status,
        c.name AS company_name,
        COUNT(a.application_id) AS total_applicants,
        COUNT(CASE WHEN a.current_stage = 'Applied' THEN 1 END) AS count_applied,
        COUNT(CASE WHEN a.current_stage = 'Shortlisted' THEN 1 END) AS count_shortlisted,
        COUNT(CASE WHEN a.current_stage = 'Interview' THEN 1 END) AS count_interview,
        COUNT(CASE WHEN a.current_stage = 'Offered' THEN 1 END) AS count_offered,
        COUNT(CASE WHEN a.current_stage = 'Accepted' THEN 1 END) AS count_accepted
      FROM internship_posting p
      JOIN company c ON p.company_id = c.company_id
      LEFT JOIN application a ON p.posting_id = a.posting_id
    `;

    const params = [];
    if (companyId) {
      sql += ` WHERE p.company_id = $1`;
      params.push(parseInt(companyId));
    }
    sql += ` GROUP BY p.posting_id, c.name ORDER BY p.created_at DESC;`;

    const res = await query(sql, params);
    return NextResponse.json({ postings: res.rows });
  } catch (err) {
    console.error('Fetch recruiter postings error:', err);
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  }
}

export async function POST(request) {
  try {
    const user = requireAuth(request, ['recruiter']);
    const body = await request.json();
    const {
      title,
      description,
      location,
      mode,
      stipend,
      openings,
      deadline,
      startDate,
      durationWeeks,
      minCgpa,
      skills,
      eligibleDepts,
      responsibilities,
      perks,
    } = body;

    if (!title || !description || !openings || !deadline || !startDate) {
      return NextResponse.json({ error: 'Title, description, openings, deadline, and start date are mandatory' }, { status: 400 });
    }

    const recRes = await query(
      `SELECT r.recruiter_id, r.company_id, c.verified, c.name AS company_name
       FROM recruiter r
       JOIN company c ON r.company_id = c.company_id
       WHERE r.user_id = $1`,
      [user.userId]
    );

    if (recRes.rows.length === 0) {
      return NextResponse.json({ error: 'Recruiter profile not found' }, { status: 404 });
    }

    const { recruiter_id: recruiterId, company_id: companyId, verified, company_name } = recRes.rows[0];

    if (!verified) {
      return NextResponse.json(
        { error: `Forbidden: Company '${company_name}' is currently unverified. Postings can only be published after verification approval by the placement cell.` },
        { status: 403 }
      );
    }

    // Generate 384-dimensional dense semantic embedding for pgvector
    const skillText = Array.isArray(skills) ? skills.map(s => s.name || s).join(' ') : '';
    const fullText = `${title} ${description} ${location || ''} ${skillText}`;
    const embedding = generateEmbedding(fullText);

    let newPostingId;

    await withTransaction(async (client) => {
      // 1. Insert into internship_posting
      const postRes = await client.query(`
        INSERT INTO internship_posting (
          company_id, recruiter_id, title, description, location, mode,
          stipend, openings, filled, deadline, start_date, duration_weeks,
          min_cgpa, status, embedding
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, 0, $9, $10, $11, $12, 'open', $13::vector
        ) RETURNING posting_id;
      `, [
        companyId,
        recruiterId,
        title.trim(),
        description.trim(),
        location || 'Bengaluru',
        mode || 'hybrid',
        parseFloat(stipend) || 0,
        parseInt(openings),
        new Date(deadline),
        new Date(startDate),
        parseInt(durationWeeks) || 12,
        parseFloat(minCgpa) || 0,
        vectorToSql(embedding)
      ]);

      newPostingId = postRes.rows[0].posting_id;

      // 2. Insert posting_skill
      if (Array.isArray(skills)) {
        for (const sk of skills) {
          const skillId = sk.skillId || sk.skill_id;
          if (skillId) {
            await client.query(`
              INSERT INTO posting_skill (posting_id, skill_id, is_mandatory, min_level)
              VALUES ($1, $2, $3, $4)
            `, [newPostingId, parseInt(skillId), sk.isMandatory !== false, parseInt(sk.minLevel) || 1]);
          }
        }
      }

      // 3. Insert posting_eligible_dept
      if (Array.isArray(eligibleDepts)) {
        for (const deptId of eligibleDepts) {
          await client.query(`
            INSERT INTO posting_eligible_dept (posting_id, dept_id)
            VALUES ($1, $2)
          `, [newPostingId, parseInt(deptId)]);
        }
      }

      // 4. Save semi-structured JD in MongoDB collection `posting_documents`
      const mongoDb = await getMongoDb();
      await mongoDb.collection('posting_documents').insertOne({
        posting_id: newPostingId,
        raw_jd: description,
        responsibilities: Array.isArray(responsibilities) ? responsibilities : ['Execute assigned project objectives.', 'Participate in engineering reviews.'],
        perks: Array.isArray(perks) ? perks : ['Certificate of Internship', 'Pre-Placement Offer Consideration'],
        created_at: new Date()
      });

      // 5. Audit log
      await client.query(`
        INSERT INTO audit_log (action, entity, entity_id, actor_id, details)
        VALUES ('POSTING_CREATED', 'internship_posting', $1, $2, $3)
      `, [newPostingId, user.userId, JSON.stringify({ title, companyId, openings })]);
    });

    return NextResponse.json({
      message: 'Internship posting created successfully with pgvector embedding and MongoDB JD document',
      postingId: newPostingId,
    }, { status: 201 });
  } catch (err) {
    console.error('Create posting error:', err);
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
