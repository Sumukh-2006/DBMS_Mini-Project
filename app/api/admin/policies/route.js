// app/api/admin/policies/route.js
import { NextResponse } from 'next/server';
const { query } = require('../../../../lib/db');
const { requireAuth } = require('../../../../lib/auth');

export async function GET(request) {
  try {
    requireAuth(request, ['admin']);
    const res = await query('SELECT key, value, description, updated_at FROM policy_config ORDER BY key');
    return NextResponse.json({ policies: res.rows });
  } catch (err) {
    console.error('Fetch policies error:', err);
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  }
}

export async function PUT(request) {
  try {
    const user = requireAuth(request, ['admin']);
    const body = await request.json();
    const { key, value } = body;

    if (!key || value === undefined) {
      return NextResponse.json({ error: 'Policy key and value are required' }, { status: 400 });
    }

    await query(
      `UPDATE policy_config SET value = $1, updated_at = CURRENT_TIMESTAMP WHERE key = $2`,
      [value.toString(), key]
    );

    await query(`
      INSERT INTO audit_log (action, entity, entity_id, actor_id, details)
      VALUES ('POLICY_UPDATED', 'policy_config', NULL, $1, $2)
    `, [user.userId, JSON.stringify({ key, value })]);

    return NextResponse.json({ message: `Policy '${key}' updated successfully to '${value}'` });
  } catch (err) {
    console.error('Update policy error:', err);
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  }
}
