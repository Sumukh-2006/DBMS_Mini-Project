// app/api/student/postings/route.js
import { NextResponse } from 'next/server';
const { query } = require('../../../../lib/db');
const { requireAuth } = require('../../../../lib/auth');

export async function GET(request) {
  try {
    const user = requireAuth(request, ['student']);
    const { searchParams } = new URL(request.url);

    const search = searchParams.get('q') || '';
    const mode = searchParams.get('mode') || '';
    const minStipend = searchParams.get('minStipend') || '';
    const skill = searchParams.get('skill') || '';
    const sort = searchParams.get('sort') || 'deadline_asc';

    // Get student details
    const stRes = await query('SELECT student_id, cgpa, dept_id FROM student WHERE user_id = $1', [user.userId]);
    const student = stRes.rows[0];

    let conditions = ["p.status = 'open'", 'p.deadline > CURRENT_TIMESTAMP'];
    let params = [student.student_id];
    let paramIdx = 2;

    // Full-Text Search on search_tsv
    if (search.trim()) {
      conditions.push(`p.search_tsv @@ plainto_tsquery('english', $${paramIdx})`);
      params.push(search.trim());
      paramIdx++;
    }

    // Filter by mode
    if (mode) {
      conditions.push(`p.mode = $${paramIdx}`);
      params.push(mode);
      paramIdx++;
    }

    // Filter by minStipend
    if (minStipend) {
      conditions.push(`p.stipend >= $${paramIdx}`);
      params.push(parseFloat(minStipend));
      paramIdx++;
    }

    // Filter by specific skill
    if (skill) {
      conditions.push(`EXISTS (
        SELECT 1 FROM posting_skill ps
        JOIN skill sk ON ps.skill_id = sk.skill_id
        WHERE ps.posting_id = p.posting_id AND LOWER(sk.name) = LOWER($${paramIdx})
      )`);
      params.push(skill.trim());
      paramIdx++;
    }

    // Sort order
    let orderBy = 'p.deadline ASC';
    if (sort === 'stipend_desc') orderBy = 'p.stipend DESC';
    else if (sort === 'newest') orderBy = 'p.created_at DESC';
    else if (sort === 'cgpa_asc') orderBy = 'p.min_cgpa ASC';

    const sql = `
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
        c.company_id,
        c.name AS company_name,
        c.industry,
        c.website,
        -- Check if student meets CGPA
        (student.cgpa >= p.min_cgpa) AS is_cgpa_eligible,
        -- Check if student dept is eligible
        (
          NOT EXISTS (SELECT 1 FROM posting_eligible_dept WHERE posting_id = p.posting_id)
          OR EXISTS (SELECT 1 FROM posting_eligible_dept WHERE posting_id = p.posting_id AND dept_id = student.dept_id)
        ) AS is_dept_eligible,
        -- Application status of this student
        a.application_id,
        a.current_stage AS student_stage,
        -- Required skills array
        (
          SELECT json_agg(json_build_object(
            'skill_id', sk.skill_id,
            'name', sk.name,
            'is_mandatory', ps.is_mandatory,
            'min_level', ps.min_level
          ))
          FROM posting_skill ps
          JOIN skill sk ON ps.skill_id = sk.skill_id
          WHERE ps.posting_id = p.posting_id
        ) AS skills,
        -- Match score
        fn_match_score(student.student_id, p.posting_id) AS skill_match_score
      FROM internship_posting p
      JOIN company c ON p.company_id = c.company_id
      CROSS JOIN (SELECT $1::INT AS student_id, ${student.cgpa}::NUMERIC AS cgpa, ${student.dept_id}::INT AS dept_id) student
      LEFT JOIN application a ON p.posting_id = a.posting_id AND a.student_id = student.student_id
      WHERE ${conditions.join(' AND ')}
      ORDER BY ${orderBy};
    `;

    const res = await query(sql, params);
    return NextResponse.json({ postings: res.rows });
  } catch (err) {
    console.error('Fetch postings error:', err);
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  }
}
