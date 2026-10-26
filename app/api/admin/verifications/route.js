// app/api/admin/verifications/route.js
import { NextResponse } from 'next/server';
const { query } = require('../../../../lib/db');
const { requireAuth } = require('../../../../lib/auth');

export async function GET(request) {
  try {
    requireAuth(request, ['admin']);

    const sql = `
      SELECT 
        c.company_id,
        c.name,
        c.website,
        c.industry,
        c.size,
        c.verified,
        c.created_at,
        (
          SELECT json_agg(json_build_object(
            'recruiter_id', r.recruiter_id,
            'user_id', r.user_id,
            'email', u.email,
            'designation', r.designation
          ))
          FROM recruiter r
          JOIN app_user u ON r.user_id = u.user_id
          WHERE r.company_id = c.company_id
        ) AS recruiters
      FROM company c
      WHERE c.verified = FALSE
      ORDER BY c.created_at ASC;
    `;

    const res = await query(sql);
    return NextResponse.json({ pendingCompanies: res.rows });
  } catch (err) {
    console.error('Fetch verifications error:', err);
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  }
}

export async function POST(request) {
  try {
    const user = requireAuth(request, ['admin']);
    const body = await request.json();
    const { companyId, action } = body; // action: 'approve' or 'reject'

    if (!companyId || !action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Valid companyId and action (approve/reject) are required' }, { status: 400 });
    }

    if (action === 'approve') {
      await query(
        `UPDATE company SET verified = TRUE, verified_by = $1 WHERE company_id = $2`,
        [user.userId, companyId]
      );
      await query(`
        INSERT INTO audit_log (action, entity, entity_id, actor_id, details)
        VALUES ('COMPANY_VERIFIED', 'company', $1, $2, '{"action":"approved"}')
      `, [companyId, user.userId]);

      return NextResponse.json({ message: 'Company verified successfully', companyId });
    } else {
      await query(
        `UPDATE company SET verified = FALSE, verified_by = NULL WHERE company_id = $1`,
        [companyId]
      );
      await query(`
        INSERT INTO audit_log (action, entity, entity_id, actor_id, details)
        VALUES ('COMPANY_REJECTED', 'company', $1, $2, '{"action":"rejected"}')
      `, [companyId, user.userId]);

      return NextResponse.json({ message: 'Company rejected', companyId });
    }
  } catch (err) {
    console.error('Process verification error:', err);
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  }
}
