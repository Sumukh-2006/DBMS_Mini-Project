// app/api/student/profile/route.js
import { NextResponse } from 'next/server';
const { query, withTransaction } = require('../../../../lib/db');
const { requireAuth } = require('../../../../lib/auth');
const { generateEmbedding, vectorToSql } = require('../../../../lib/embeddings');
const { getMongoDb } = require('../../../../lib/mongo');

export async function GET(request) {
  try {
    const user = requireAuth(request, ['student']);

    // 1. Fetch student info
    const stRes = await query(
      `SELECT s.student_id, s.usn, s.full_name, s.cgpa, s.year, s.grad_year, s.phone, s.about, s.portfolio_url,
              d.dept_id, d.code AS dept_code, d.name AS dept_name
       FROM student s
       JOIN department d ON s.dept_id = d.dept_id
       WHERE s.user_id = $1`,
      [user.userId]
    );

    if (stRes.rows.length === 0) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 });
    }

    const student = stRes.rows[0];

    // 2. Fetch student skills
    const skRes = await query(
      `SELECT sk.skill_id, sk.name, sk.category, ss.proficiency
       FROM student_skill ss
       JOIN skill sk ON ss.skill_id = sk.skill_id
       WHERE ss.student_id = $1
       ORDER BY sk.category, sk.name`,
      [student.student_id]
    );

    // 3. Fetch all available skills catalogue
    const allSkillsRes = await query('SELECT skill_id, name, category FROM skill ORDER BY category, name');

    // 4. Fetch parsed resume from MongoDB
    const mongoDb = await getMongoDb();
    const resume = await mongoDb.collection('resumes').findOne({ student_id: student.student_id });

    return NextResponse.json({
      student,
      skills: skRes.rows,
      allSkills: allSkillsRes.rows,
      resume: resume ? resume.parsed : null,
    });
  } catch (err) {
    console.error('Fetch profile error:', err);
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  }
}

export async function PUT(request) {
  try {
    const user = requireAuth(request, ['student']);
    const body = await request.json();
    const { phone, about, portfolioUrl, skills } = body;

    const stRes = await query('SELECT student_id, full_name, cgpa, dept_id FROM student WHERE user_id = $1', [user.userId]);
    const student = stRes.rows[0];

    await withTransaction(async (client) => {
      // 1. Update basic fields
      await client.query(
        `UPDATE student
         SET phone = $1, about = $2, portfolio_url = $3, updated_at = CURRENT_TIMESTAMP
         WHERE student_id = $4`,
        [phone || null, about || null, portfolioUrl || null, student.student_id]
      );

      // 2. Update skills if provided
      if (Array.isArray(skills)) {
        await client.query('DELETE FROM student_skill WHERE student_id = $1', [student.student_id]);
        for (const sk of skills) {
          if (sk.skillId && sk.proficiency) {
            await client.query(
              `INSERT INTO student_skill (student_id, skill_id, proficiency) VALUES ($1, $2, $3)`,
              [student.student_id, parseInt(sk.skillId), parseInt(sk.proficiency)]
            );
          }
        }
      }

      // 3. Recompute profile vector embedding
      const currentSkills = await client.query(
        `SELECT sk.name FROM student_skill ss JOIN skill sk ON ss.skill_id = sk.skill_id WHERE ss.student_id = $1`,
        [student.student_id]
      );
      const skillNames = currentSkills.rows.map(r => r.name).join(' ');
      const profileText = `${student.full_name} ${about || ''} ${skillNames}`;
      const newEmbedding = generateEmbedding(profileText);

      await client.query(
        `UPDATE student SET profile_embedding = $1::vector WHERE student_id = $2`,
        [vectorToSql(newEmbedding), student.student_id]
      );
    });

    return NextResponse.json({ message: 'Profile and vector embedding updated successfully' });
  } catch (err) {
    console.error('Update profile error:', err);
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  }
}
