// app/api/student/pipeline/route.js
import { NextResponse } from 'next/server';
const { query } = require('../../../../lib/db');
const { requireAuth } = require('../../../../lib/auth');

export async function GET(request) {
  try {
    const user = requireAuth(request, ['student']);

    const stRes = await query('SELECT student_id FROM student WHERE user_id = $1', [user.userId]);
    const student = stRes.rows[0];

    // Query the student pipeline view
    const sql = `
      SELECT *
      FROM v_student_pipeline
      WHERE student_id = $1
      ORDER BY applied_at DESC;
    `;

    const res = await query(sql, [student.student_id]);

    // Group by stage for the Kanban board
    const kanban = {
      Applied: [],
      Shortlisted: [],
      Interview: [],
      Offered: [],
      Accepted: [],
      Rejected: [],
      Withdrawn: [],
    };

    res.rows.forEach(app => {
      if (kanban[app.current_stage]) {
        kanban[app.current_stage].push(app);
      }
    });

    return NextResponse.json({
      applications: res.rows,
      kanban,
    });
  } catch (err) {
    console.error('Pipeline error:', err);
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  }
}
