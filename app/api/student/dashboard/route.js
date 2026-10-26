// app/api/student/dashboard/route.js
import { NextResponse } from 'next/server';
const { query } = require('../../../../lib/db');
const { requireAuth } = require('../../../../lib/auth');
const { getMongoDb } = require('../../../../lib/mongo');

export async function GET(request) {
  try {
    const user = requireAuth(request, ['student']);

    // Get student details
    const stRes = await query(
      `SELECT student_id, usn, full_name, cgpa, year, dept_id FROM student WHERE user_id = $1`,
      [user.userId]
    );

    if (stRes.rows.length === 0) {
      return NextResponse.json({ error: 'Student record not found' }, { status: 404 });
    }

    const student = stRes.rows[0];

    // Pipeline stage distribution
    const stageRes = await query(
      `SELECT current_stage, count(*) AS count
       FROM application
       WHERE student_id = $1
       GROUP BY current_stage`,
      [student.student_id]
    );

    const stages = {
      Applied: 0,
      Shortlisted: 0,
      Interview: 0,
      Offered: 0,
      Accepted: 0,
      Rejected: 0,
      Withdrawn: 0,
    };
    stageRes.rows.forEach(r => { stages[r.current_stage] = parseInt(r.count); });

    // Active applications count
    const activeCount = stages.Applied + stages.Shortlisted + stages.Interview + stages.Offered;

    // Next scheduled interview
    const interviewRes = await query(
      `SELECT i.interview_id, i.round_no, i.scheduled_at, i.duration_min, i.mode, i.link_or_room,
              p.title AS posting_title, c.name AS company_name
       FROM interview i
       JOIN application a ON i.application_id = a.application_id
       JOIN internship_posting p ON a.posting_id = p.posting_id
       JOIN company c ON p.company_id = c.company_id
       WHERE a.student_id = $1 AND i.status = 'scheduled' AND i.scheduled_at > CURRENT_TIMESTAMP
       ORDER BY i.scheduled_at ASC
       LIMIT 1`,
      [student.student_id]
    );

    // Pending offers
    const offersRes = await query(
      `SELECT o.offer_id, o.stipend, o.start_date, o.expires_at, o.status,
              p.title AS posting_title, c.name AS company_name
       FROM offer o
       JOIN application a ON o.application_id = a.application_id
       JOIN internship_posting p ON a.posting_id = p.posting_id
       JOIN company c ON p.company_id = c.company_id
       WHERE a.student_id = $1 AND o.status = 'pending'`,
      [student.student_id]
    );

    // Accepted offer (if placed)
    const placedRes = await query(
      `SELECT o.offer_id, o.stipend, o.start_date, p.title AS posting_title, c.name AS company_name
       FROM offer o
       JOIN application a ON o.application_id = a.application_id
       JOIN internship_posting p ON a.posting_id = p.posting_id
       JOIN company c ON p.company_id = c.company_id
       WHERE a.student_id = $1 AND o.status = 'accepted'
       LIMIT 1`,
      [student.student_id]
    );

    // Upcoming closing deadlines from view
    const deadlinesRes = await query(
      `SELECT * FROM v_upcoming_deadlines LIMIT 3`
    );

    // Notifications from MongoDB
    const mongoDb = await getMongoDb();
    const notifications = await mongoDb.collection('notifications')
      .find({ user_id: user.userId })
      .sort({ created_at: -1 })
      .limit(5)
      .toArray();

    return NextResponse.json({
      student,
      stages,
      activeCount,
      isPlaced: placedRes.rows.length > 0,
      placedOffer: placedRes.rows[0] || null,
      nextInterview: interviewRes.rows[0] || null,
      pendingOffers: offersRes.rows,
      upcomingDeadlines: deadlinesRes.rows,
      notifications,
    });
  } catch (err) {
    console.error('Student dashboard error:', err);
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  }
}
