// app/api/recruiter/offers/route.js
import { NextResponse } from 'next/server';
const { query } = require('../../../../lib/db');
const { requireAuth } = require('../../../../lib/auth');
const { getMongoDb } = require('../../../../lib/mongo');

export async function POST(request) {
  try {
    const user = requireAuth(request, ['recruiter', 'admin']);
    const body = await request.json();
    const { applicationId, stipend, startDate, expiryDays } = body;

    if (!applicationId || !stipend || !startDate) {
      return NextResponse.json({ error: 'Application ID, stipend, and start date are required' }, { status: 400 });
    }

    // Authorization: Verify recruiter belongs to the company owning the posting
    if (user.role === 'recruiter') {
      const recRes = await query('SELECT company_id FROM recruiter WHERE user_id = $1', [user.userId]);
      const userCompanyId = recRes.rows[0]?.company_id;
      const appOwner = await query(
        `SELECT p.company_id FROM application a JOIN internship_posting p ON a.posting_id = p.posting_id WHERE a.application_id = $1`,
        [parseInt(applicationId)]
      );
      if (appOwner.rows.length === 0 || appOwner.rows[0].company_id !== userCompanyId) {
        return NextResponse.json(
          { error: 'Forbidden: You cannot issue offers for candidates applied to another company.' },
          { status: 403 }
        );
      }
    }

    // Call stored procedure sp_issue_offer
    await query(
      `CALL sp_issue_offer($1, $2, $3, $4, $5, NULL);`,
      [
        parseInt(applicationId),
        parseFloat(stipend),
        new Date(startDate),
        parseInt(expiryDays) || 7,
        user.userId,
      ]
    );

    // Fetch student info to insert notification in MongoDB
    const appRes = await query(
      `SELECT a.student_id, s.user_id, s.full_name, p.title AS posting_title, c.name AS company_name
       FROM application a
       JOIN student s ON a.student_id = s.student_id
       JOIN internship_posting p ON a.posting_id = p.posting_id
       JOIN company c ON p.company_id = c.company_id
       WHERE a.application_id = $1`,
      [applicationId]
    );

    if (appRes.rows.length > 0) {
      const { user_id: studentUserId, posting_title, company_name } = appRes.rows[0];
      const mongoDb = await getMongoDb();
      await mongoDb.collection('notifications').insertOne({
        user_id: studentUserId,
        type: 'OFFER_ISSUED',
        title: `Offer Received from ${company_name}!`,
        message: `Congratulations! ${company_name} has issued an internship offer for ${posting_title} with stipend ₹${stipend}/mo. Please respond before expiry.`,
        read: false,
        created_at: new Date(),
        expireAt: new Date(Date.now() + 30 * 86400000),
      });
    }

    return NextResponse.json({
      message: 'Offer issued successfully. Candidate transitioned to Offered stage.',
      applicationId,
    }, { status: 201 });
  } catch (err) {
    console.error('Issue offer error:', err);
    return NextResponse.json({ error: err.message || 'Failed to issue offer' }, { status: 400 });
  }
}
