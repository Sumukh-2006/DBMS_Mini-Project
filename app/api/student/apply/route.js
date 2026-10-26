// app/api/student/apply/route.js
import { NextResponse } from 'next/server';
const { query } = require('../../../../lib/db');
const { requireAuth } = require('../../../../lib/auth');

export async function POST(request) {
  try {
    const user = requireAuth(request, ['student']);
    const body = await request.json();
    const { postingId } = body;

    if (!postingId) {
      return NextResponse.json({ error: 'Posting ID is required' }, { status: 400 });
    }

    const stRes = await query('SELECT student_id FROM student WHERE user_id = $1', [user.userId]);
    const studentId = stRes.rows[0].student_id;

    // Check if student has already applied
    const existing = await query(
      'SELECT application_id, current_stage FROM application WHERE student_id = $1 AND posting_id = $2',
      [studentId, postingId]
    );

    if (existing.rows.length > 0) {
      return NextResponse.json({
        error: `You have already applied to this posting (Current Stage: ${existing.rows[0].current_stage})`
      }, { status: 409 });
    }

    // Call stored procedure sp_apply
    const applyRes = await query(
      `CALL sp_apply($1, $2, NULL);`,
      [studentId, postingId]
    );

    return NextResponse.json({
      message: 'Application submitted successfully! Your application is now in the Applied stage.',
      postingId,
    }, { status: 201 });
  } catch (err) {
    console.error('Apply error:', err);
    // Extract clean PostgreSQL exception message
    const msg = err.message || 'Failed to submit application';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
