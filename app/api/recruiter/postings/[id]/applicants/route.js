// app/api/recruiter/postings/[id]/applicants/route.js
import { NextResponse } from 'next/server';
const { query } = require('../../../../../../lib/db');
const { requireAuth } = require('../../../../../../lib/auth');

export async function GET(request, { params }) {
  try {
    const user = requireAuth(request, ['recruiter', 'admin']);
    const postingId = parseInt(params.id);
    const { searchParams } = new URL(request.url);
    const stage = searchParams.get('stage');

    // Verify posting exists
    const postRes = await query(
      `SELECT p.posting_id, p.title, p.company_id, p.embedding, c.name AS company_name
       FROM internship_posting p
       JOIN company c ON p.company_id = c.company_id
       WHERE p.posting_id = $1`,
      [postingId]
    );

    if (postRes.rows.length === 0) {
      return NextResponse.json({ error: 'Posting not found' }, { status: 404 });
    }

    const posting = postRes.rows[0];

    // Authorization: Recruiters may only view applicants for their own company
    if (user.role === 'recruiter') {
      const recRes = await query('SELECT company_id FROM recruiter WHERE user_id = $1', [user.userId]);
      if (recRes.rows.length === 0 || recRes.rows[0].company_id !== posting.company_id) {
        return NextResponse.json(
          { error: 'Forbidden: You do not have permission to access applicants belonging to another company.' },
          { status: 403 }
        );
      }
    }

    let conditions = ['a.posting_id = $1'];
    let queryParams = [postingId];

    if (stage) {
      conditions.push('a.current_stage = $2');
      queryParams.push(stage);
    }

    const sql = `
      SELECT 
        a.application_id,
        a.applied_at,
        a.current_stage,
        a.match_score,
        a.withdrawn_at,
        s.student_id,
        s.user_id,
        s.usn,
        s.full_name,
        s.cgpa,
        s.year,
        s.grad_year,
        s.phone,
        s.about,
        d.code AS dept_code,
        d.name AS dept_name,
        -- Semantic vector similarity against this specific posting
        ROUND((1 - (p.embedding <=> s.profile_embedding))::NUMERIC, 4) AS vector_similarity,
        -- Skills list of candidate
        (
          SELECT json_agg(json_build_object(
            'skill_id', sk.skill_id,
            'name', sk.name,
            'proficiency', ss.proficiency
          ))
          FROM student_skill ss
          JOIN skill sk ON ss.skill_id = sk.skill_id
          WHERE ss.student_id = s.student_id
        ) AS student_skills,
        -- Stage history timeline
        (
          SELECT json_agg(json_build_object(
            'from_stage', ash.from_stage,
            'to_stage', ash.to_stage,
            'reason', ash.reason,
            'changed_at', ash.changed_at
          ) ORDER BY ash.changed_at ASC)
          FROM application_stage_history ash
          WHERE ash.application_id = a.application_id
        ) AS stage_history,
        -- Active offer if exists
        (
          SELECT json_build_object(
            'offer_id', o.offer_id,
            'stipend', o.stipend,
            'start_date', o.start_date,
            'expires_at', o.expires_at,
            'status', o.status
          )
          FROM offer o
          WHERE o.application_id = a.application_id
          LIMIT 1
        ) AS offer_info
      FROM application a
      JOIN student s ON a.student_id = s.student_id
      JOIN department d ON s.dept_id = d.dept_id
      JOIN internship_posting p ON a.posting_id = p.posting_id
      WHERE ${conditions.join(' AND ')}
      ORDER BY a.match_score DESC, vector_similarity DESC;
    `;

    const res = await query(sql, queryParams);

    return NextResponse.json({
      posting,
      applicants: res.rows,
    });
  } catch (err) {
    console.error('Fetch applicants error:', err);
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  }
}
