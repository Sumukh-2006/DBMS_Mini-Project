// app/api/recruiter/analytics/funnel/route.js
import { NextResponse } from 'next/server';
const { query } = require('../../../../../lib/db');
const { requireAuth } = require('../../../../../lib/auth');

export async function GET(request) {
  try {
    const user = requireAuth(request, ['recruiter', 'admin']);
    const { searchParams } = new URL(request.url);
    const postingId = searchParams.get('postingId');

    let sql = `
      SELECT *
      FROM v_posting_funnel
    `;
    const params = [];

    if (postingId) {
      sql += ` WHERE posting_id = $1`;
      params.push(parseInt(postingId));
    } else if (user.role === 'recruiter') {
      const rec = await query('SELECT company_id FROM recruiter WHERE user_id = $1', [user.userId]);
      sql = `
        SELECT f.*
        FROM v_posting_funnel f
        JOIN internship_posting p ON f.posting_id = p.posting_id
        WHERE p.company_id = $1
        ORDER BY f.posting_id DESC;
      `;
      params.push(rec.rows[0].company_id);
    }

    const res = await query(sql, params);
    return NextResponse.json({ funnel: res.rows });
  } catch (err) {
    console.error('Funnel analytics error:', err);
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  }
}
