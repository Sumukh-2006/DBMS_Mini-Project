// app/api/recruiter/dashboard/route.js
import { NextResponse } from 'next/server';
const { query } = require('../../../../lib/db');
const { requireAuth } = require('../../../../lib/auth');

export async function GET(request) {
  try {
    const user = requireAuth(request, ['recruiter']);

    const recRes = await query(
      `SELECT r.recruiter_id, r.company_id, c.name AS company_name, c.verified
       FROM recruiter r
       JOIN company c ON r.company_id = c.company_id
       WHERE r.user_id = $1`,
      [user.userId]
    );

    if (recRes.rows.length === 0) {
      return NextResponse.json({ error: 'Recruiter record not found' }, { status: 404 });
    }

    const recruiter = recRes.rows[0];

    // Postings counts
    const postRes = await query(
      `SELECT 
        COUNT(*) AS total_postings,
        COUNT(CASE WHEN status = 'open' THEN 1 END) AS active_postings,
        COALESCE(SUM(openings), 0) AS total_openings,
        COALESCE(SUM(filled), 0) AS total_filled
       FROM internship_posting
       WHERE company_id = $1`,
      [recruiter.company_id]
    );

    // Applicants breakdown
    const appRes = await query(
      `SELECT 
        COUNT(a.application_id) AS total_applicants,
        COUNT(CASE WHEN a.current_stage = 'Applied' THEN 1 END) AS count_applied,
        COUNT(CASE WHEN a.current_stage = 'Shortlisted' THEN 1 END) AS count_shortlisted,
        COUNT(CASE WHEN a.current_stage = 'Interview' THEN 1 END) AS count_interview,
        COUNT(CASE WHEN a.current_stage = 'Offered' THEN 1 END) AS count_offered,
        COUNT(CASE WHEN a.current_stage = 'Accepted' THEN 1 END) AS count_accepted
       FROM application a
       JOIN internship_posting p ON a.posting_id = p.posting_id
       WHERE p.company_id = $1`,
      [recruiter.company_id]
    );

    // Upcoming interviews
    const intRes = await query(
      `SELECT i.interview_id, i.round_no, i.scheduled_at, i.duration_min, i.mode, i.link_or_room,
              s.full_name AS candidate_name, s.usn, p.title AS posting_title
       FROM interview i
       JOIN application a ON i.application_id = a.application_id
       JOIN student s ON a.student_id = s.student_id
       JOIN internship_posting p ON a.posting_id = p.posting_id
       WHERE p.company_id = $1 AND i.status = 'scheduled' AND i.scheduled_at > CURRENT_TIMESTAMP
       ORDER BY i.scheduled_at ASC
       LIMIT 5`,
      [recruiter.company_id]
    );

    return NextResponse.json({
      recruiter,
      postingsSummary: postRes.rows[0],
      applicantsSummary: appRes.rows[0],
      upcomingInterviews: intRes.rows,
    });
  } catch (err) {
    console.error('Recruiter dashboard error:', err);
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  }
}
