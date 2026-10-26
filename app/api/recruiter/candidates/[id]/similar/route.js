// app/api/recruiter/candidates/[id]/similar/route.js
import { NextResponse } from 'next/server';
const { query } = require('../../../../../../lib/db');
const { requireAuth } = require('../../../../../../lib/auth');

export async function GET(request, { params }) {
  try {
    requireAuth(request, ['recruiter', 'admin']);
    const studentId = parseInt(params.id);

    // Fetch target candidate info
    const targetRes = await query(
      `SELECT s.student_id, s.full_name, s.usn, d.name AS dept_name
       FROM student s
       JOIN department d ON s.dept_id = d.dept_id
       WHERE s.student_id = $1`,
      [studentId]
    );

    if (targetRes.rows.length === 0) {
      return NextResponse.json({ error: 'Candidate not found' }, { status: 404 });
    }

    const target = targetRes.rows[0];

    // Find nearest neighbors in pgvector space using cosine distance
    const sql = `
      SELECT 
        s.student_id,
        s.usn,
        s.full_name,
        s.cgpa,
        s.year,
        s.about,
        d.code AS dept_code,
        d.name AS dept_name,
        ROUND((1 - (s.profile_embedding <=> target.profile_embedding))::NUMERIC, 4) AS semantic_similarity,
        (
          SELECT json_agg(json_build_object('skill', sk.name, 'proficiency', ss.proficiency))
          FROM student_skill ss
          JOIN skill sk ON ss.skill_id = sk.skill_id
          WHERE ss.student_id = s.student_id
        ) AS skills
      FROM student s
      CROSS JOIN (SELECT profile_embedding FROM student WHERE student_id = $1) target
      JOIN department d ON s.dept_id = d.dept_id
      WHERE s.student_id <> $1
      ORDER BY (s.profile_embedding <=> target.profile_embedding) ASC
      LIMIT 5;
    `;

    const res = await query(sql, [studentId]);

    return NextResponse.json({
      targetCandidate: target,
      similarCandidates: res.rows,
    });
  } catch (err) {
    console.error('Similar candidates error:', err);
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  }
}
