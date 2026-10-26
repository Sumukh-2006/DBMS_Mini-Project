// app/api/student/recommendations/route.js
import { NextResponse } from 'next/server';
const { query } = require('../../../../lib/db');
const { requireAuth } = require('../../../../lib/auth');

export async function GET(request) {
  try {
    const user = requireAuth(request, ['student']);

    // Get student details including profile embedding
    const stRes = await query(
      `SELECT student_id, cgpa, dept_id, profile_embedding FROM student WHERE user_id = $1`,
      [user.userId]
    );

    if (stRes.rows.length === 0) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 });
    }

    const student = stRes.rows[0];

    // Hybrid Vector Similarity Search Query
    // 1. Pre-filter by status='open', deadline > NOW, filled < openings, CGPA >= min_cgpa, department eligibility
    // 2. Compute Cosine Distance <=> using HNSW vector index
    // 3. Compute domain skill overlap using fn_match_score()
    // 4. Combine into a unified hybrid recommendation score (60% skill coverage + 40% semantic similarity)
    const hybridSql = `
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
        p.duration_weeks,
        p.min_cgpa,
        c.company_id,
        c.name AS company_name,
        c.industry,
        -- Semantic similarity from pgvector cosine distance (0 to 1)
        ROUND((1 - (p.embedding <=> s.profile_embedding))::NUMERIC, 4) AS semantic_similarity,
        -- Domain skill match score (0 to 100)
        fn_match_score(s.student_id, p.posting_id) AS skill_score,
        -- Combined hybrid score
        ROUND(
          ((0.6 * fn_match_score(s.student_id, p.posting_id)) + 
          (0.4 * ((1 - (p.embedding <=> s.profile_embedding)) * 100)))::NUMERIC,
          2
        ) AS hybrid_score,
        -- Matched skills
        (
          SELECT json_agg(json_build_object('skill', sk.name, 'proficiency', ss.proficiency))
          FROM posting_skill ps
          JOIN student_skill ss ON ps.skill_id = ss.skill_id AND ss.student_id = s.student_id
          JOIN skill sk ON ps.skill_id = sk.skill_id
          WHERE ps.posting_id = p.posting_id
        ) AS matched_skills,
        -- Missing mandatory skills
        (
          SELECT json_agg(json_build_object('skill', sk.name, 'min_level', ps.min_level))
          FROM posting_skill ps
          JOIN skill sk ON ps.skill_id = sk.skill_id
          LEFT JOIN student_skill ss ON ps.skill_id = ss.skill_id AND ss.student_id = s.student_id
          WHERE ps.posting_id = p.posting_id AND ps.is_mandatory = TRUE AND ss.student_id IS NULL
        ) AS missing_mandatory_skills,
        -- Application status if already applied
        a.current_stage AS student_stage
      FROM internship_posting p
      JOIN company c ON p.company_id = c.company_id
      CROSS JOIN student s
      LEFT JOIN application a ON p.posting_id = a.posting_id AND a.student_id = s.student_id
      WHERE s.student_id = $1
        AND p.status = 'open'
        AND p.deadline > CURRENT_TIMESTAMP
        AND p.filled < p.openings
        AND s.cgpa >= p.min_cgpa
        AND (
          NOT EXISTS (SELECT 1 FROM posting_eligible_dept WHERE posting_id = p.posting_id)
          OR EXISTS (SELECT 1 FROM posting_eligible_dept WHERE posting_id = p.posting_id AND dept_id = s.dept_id)
        )
      ORDER BY hybrid_score DESC
      LIMIT 10;
    `;

    const res = await query(hybridSql, [student.student_id]);
    return NextResponse.json({ recommendations: res.rows });
  } catch (err) {
    console.error('Recommendations error:', err);
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  }
}
