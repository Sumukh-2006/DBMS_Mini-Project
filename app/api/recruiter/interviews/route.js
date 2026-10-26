// app/api/recruiter/interviews/route.js
import { NextResponse } from 'next/server';
const { query, withTransaction } = require('../../../../lib/db');
const { requireAuth } = require('../../../../lib/auth');
const { getMongoDb } = require('../../../../lib/mongo');

export async function POST(request) {
  try {
    const user = requireAuth(request, ['recruiter', 'admin']);
    const body = await request.json();
    const { applicationId, roundNo, scheduledAt, durationMin, mode, linkOrRoom, panelistRecruiterId } = body;

    if (!applicationId || !roundNo || !scheduledAt) {
      return NextResponse.json({ error: 'applicationId, roundNo, and scheduledAt are required' }, { status: 400 });
    }

    let recruiterId = panelistRecruiterId;
    if (user.role === 'recruiter') {
      const rec = await query('SELECT recruiter_id, company_id FROM recruiter WHERE user_id = $1', [user.userId]);
      if (rec.rows.length === 0) {
        return NextResponse.json({ error: 'Recruiter profile not found' }, { status: 404 });
      }
      if (!recruiterId) {
        recruiterId = rec.rows[0].recruiter_id;
      }
      const appOwner = await query(
        `SELECT p.company_id FROM application a JOIN internship_posting p ON a.posting_id = p.posting_id WHERE a.application_id = $1`,
        [parseInt(applicationId)]
      );
      if (appOwner.rows.length === 0 || appOwner.rows[0].company_id !== rec.rows[0].company_id) {
        return NextResponse.json(
          { error: 'Forbidden: You cannot schedule interviews for another company\'s candidates.' },
          { status: 403 }
        );
      }
    }

    let interviewId;

    await withTransaction(async (client) => {
      // 1. Insert interview (trigger trg_interview_clash will run BEFORE INSERT)
      const intRes = await client.query(`
        INSERT INTO interview (
          application_id, round_no, scheduled_at, duration_min, mode, link_or_room, status
        ) VALUES ($1, $2, $3, $4, $5, $6, 'scheduled')
        RETURNING interview_id;
      `, [
        parseInt(applicationId),
        parseInt(roundNo),
        new Date(scheduledAt),
        parseInt(durationMin) || 45,
        mode || 'online',
        linkOrRoom || 'https://meet.google.com/pes-interview',
      ]);

      interviewId = intRes.rows[0].interview_id;

      // 2. Associate panelist
      if (recruiterId) {
        await client.query(`
          INSERT INTO interview_panelist (interview_id, recruiter_id)
          VALUES ($1, $2)
          ON CONFLICT DO NOTHING;
        `, [interviewId, recruiterId]);
      }

      // 3. Move stage to Interview if currently Shortlisted
      const appRes = await client.query('SELECT current_stage, student_id, posting_id FROM application WHERE application_id = $1', [applicationId]);
      const app = appRes.rows[0];
      if (app.current_stage === 'Shortlisted') {
        await client.query(`CALL sp_advance_stage($1, 'Interview', $2, 'Interview round scheduled');`, [applicationId, user.userId]);
      }

      // 4. Create student notification in MongoDB
      const studentUserRes = await client.query('SELECT user_id, full_name FROM student WHERE student_id = $1', [app.student_id]);
      const studentUserId = studentUserRes.rows[0].user_id;

      const postingRes = await client.query('SELECT title FROM internship_posting WHERE posting_id = $1', [app.posting_id]);
      const postingTitle = postingRes.rows[0].title;

      const mongoDb = await getMongoDb();
      await mongoDb.collection('notifications').insertOne({
        user_id: studentUserId,
        type: 'INTERVIEW_SCHEDULED',
        title: `Interview Round ${roundNo} Scheduled`,
        message: `Your interview for ${postingTitle} has been scheduled for ${new Date(scheduledAt).toLocaleString()}.`,
        read: false,
        created_at: new Date(),
        expireAt: new Date(Date.now() + 30 * 86400000),
      });
    });

    return NextResponse.json({
      message: 'Interview round scheduled successfully',
      interviewId,
    }, { status: 201 });
  } catch (err) {
    console.error('Schedule interview error:', err);
    return NextResponse.json({ error: err.message || 'Failed to schedule interview' }, { status: 400 });
  }
}
