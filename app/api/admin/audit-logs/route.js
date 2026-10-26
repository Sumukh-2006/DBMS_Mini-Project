// app/api/admin/audit-logs/route.js
import { NextResponse } from 'next/server';
const { query } = require('../../../../lib/db');
const { requireAuth } = require('../../../../lib/auth');

export async function GET(request) {
  try {
    requireAuth(request, ['admin']);
    const { searchParams } = new URL(request.url);
    const entity = searchParams.get('entity');
    const limit = parseInt(searchParams.get('limit')) || 50;

    let sql = `
      SELECT 
        a.audit_id,
        a.action,
        a.entity,
        a.entity_id,
        a.actor_id,
        u.email AS actor_email,
        u.role AS actor_role,
        a.details,
        a.created_at
      FROM audit_log a
      LEFT JOIN app_user u ON a.actor_id = u.user_id
    `;

    const params = [];
    if (entity) {
      sql += ` WHERE a.entity = $1`;
      params.push(entity);
    }

    sql += ` ORDER BY a.created_at DESC LIMIT $${params.length + 1};`;
    params.push(limit);

    const res = await query(sql, params);
    return NextResponse.json({ auditLogs: res.rows });
  } catch (err) {
    console.error('Fetch audit logs error:', err);
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  }
}
