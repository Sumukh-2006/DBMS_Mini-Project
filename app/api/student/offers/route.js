// app/api/student/offers/route.js
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
        o.offer_id,
        o.application_id,
        o.stipend,
        o.start_date,
        o.issued_at,
        o.expires_at,
        o.status,
        o.responded_at,
        p.posting_id,
        p.title AS posting_title,
        p.location,
        p.mode,
        c.company_id,
        c.name AS company_name,
        c.industry,
        c.website,
        (o.expires_at < CURRENT_TIMESTAMP AND o.status = 'pending') AS is_expired
      FROM offer o
      JOIN application a ON o.application_id = a.application_id
      JOIN internship_posting p ON a.posting_id = p.posting_id
      JOIN company c ON p.company_id = c.company_id
      WHERE a.student_id = $1
      ORDER BY o.issued_at DESC;
    `;

    const res = await query(sql, [studentId]);
    return NextResponse.json({ offers: res.rows });
  } catch (err) {
    console.error('Offers fetch error:', err);
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  }
}

export async function POST(request) {
  try {
    const user = requireAuth(request, ['student']);
    const body = await request.json();
    const { offerId, action } = body;

    if (!offerId || !action || !['accept', 'decline'].includes(action)) {
      return NextResponse.json({ error: 'Valid offerId and action (accept/decline) are required' }, { status: 400 });
    }

    const stRes = await query('SELECT student_id FROM student WHERE user_id = $1', [user.userId]);
    const studentId = stRes.rows[0].student_id;

    if (action === 'accept') {
      // Execute atomic concurrency-safe stored procedure sp_accept_offer
      await query(`CALL sp_accept_offer($1, $2);`, [offerId, studentId]);

      return NextResponse.json({
        message: 'Congratulations! Offer accepted successfully. Your placement is finalized and other active applications have been automatically withdrawn per University placement policy.',
        offerId,
        status: 'accepted',
      });
    } else {
      // Decline offer: Verify offer belongs to authenticated student
      const offerCheck = await query(
        `SELECT o.offer_id FROM offer o JOIN application a ON o.application_id = a.application_id WHERE o.offer_id = $1 AND a.student_id = $2`,
        [offerId, studentId]
      );
      if (offerCheck.rows.length === 0) {
        return NextResponse.json(
          { error: 'Forbidden: Offer does not belong to you or does not exist.' },
          { status: 403 }
        );
      }

      await query(
        `UPDATE offer SET status = 'declined', responded_at = CURRENT_TIMESTAMP WHERE offer_id = $1`,
        [offerId]
      );
      // Move application to Rejected/Withdrawn
      await query(
        `UPDATE application SET current_stage = 'Rejected', updated_at = CURRENT_TIMESTAMP
         WHERE application_id = (SELECT application_id FROM offer WHERE offer_id = $1)`,
        [offerId]
      );

      return NextResponse.json({
        message: 'Offer declined.',
        offerId,
        status: 'declined',
      });
    }
  } catch (err) {
    console.error('Offer response error:', err);
    return NextResponse.json({ error: err.message || 'Failed to process offer response' }, { status: 400 });
  }
}
