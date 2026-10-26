// app/api/recruiter/interviews/feedback/route.js
import { NextResponse } from 'next/server';
const { requireAuth } = require('../../../../../lib/auth');
const { getMongoDb } = require('../../../../../lib/mongo');
const { query } = require('../../../../../lib/db');

export async function POST(request) {
  try {
    const user = requireAuth(request, ['recruiter', 'admin']);
    const body = await request.json();
    const { interviewId, rubric, comments, recommendation } = body;

    if (!interviewId || !rubric) {
      return NextResponse.json({ error: 'Interview ID and evaluation rubric are required' }, { status: 400 });
    }

    let panelistId = user.userId;
    if (user.role === 'recruiter') {
      const rec = await query('SELECT recruiter_id FROM recruiter WHERE user_id = $1', [user.userId]);
      if (rec.rows.length > 0) panelistId = rec.rows[0].recruiter_id;
    }

    // Save structured feedback in MongoDB
    const mongoDb = await getMongoDb();
    const feedbackDoc = {
      interview_id: parseInt(interviewId),
      panelist_id: panelistId,
      rubric, // flexible structure: { dsa: 4, system_design: 5, communication: 4, ... }
      comments: comments || '',
      recommendation: recommendation || 'Hire',
      submitted_at: new Date(),
    };

    const res = await mongoDb.collection('interview_feedback').updateOne(
      { interview_id: parseInt(interviewId), panelist_id: panelistId },
      { $set: feedbackDoc },
      { upsert: true }
    );

    // Mark interview status as completed in PostgreSQL
    await query(`UPDATE interview SET status = 'completed' WHERE interview_id = $1`, [parseInt(interviewId)]);

    return NextResponse.json({
      message: 'Interview evaluation feedback recorded successfully in MongoDB',
      feedbackId: res.upsertedId || 'updated',
    });
  } catch (err) {
    console.error('Interview feedback error:', err);
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  }
}
