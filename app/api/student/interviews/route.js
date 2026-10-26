// app/api/student/interviews/route.js
import { NextResponse } from 'next/server';
const { query } = require('../../../../lib/db');
const { requireAuth } = require('../../../../lib/auth');

export async function GET(request) {
  try {
    const user = requireAuth(request, ['student']);
    const stRes = await query('SELECT student_id FROM student WHERE user_id = $1', [user.userId]);
    const studentId = stRes.rows[0].student_id;

    const sql = `
      SELECT 
        i.interview_id,
        i.round_no,
        i.scheduled_at,
        i.duration_min,
        i.mode,
        i.link_or_room,
        i.status,
        p.title AS posting_title,
        c.name AS company_name,
        c.industry,
        (
          SELECT json_agg(json_build_object(
            'recruiter_id', r.recruiter_id,
            'designation', r.designation
          ))
          FROM interview_panelist ip
          JOIN recruiter r ON ip.recruiter_id = r.recruiter_id
          WHERE ip.interview_id = i.interview_id
        ) AS panelists,
        -- Check if clash exists
        fn_interview_clash(a.student_id, i.scheduled_at, i.duration_min, i.interview_id) AS has_clash
      FROM interview i
      JOIN application a ON i.application_id = a.application_id
      JOIN internship_posting p ON a.posting_id = p.posting_id
      JOIN company c ON p.company_id = c.company_id
      WHERE a.student_id = $1
      ORDER BY i.scheduled_at ASC;
    `;

    const res = await query(sql, [studentId]);
    return NextResponse.json({ interviews: res.rows });
  } catch (err) {
    console.error('Fetch interviews error:', err);
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  }
}
