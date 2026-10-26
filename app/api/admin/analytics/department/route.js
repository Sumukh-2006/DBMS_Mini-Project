// app/api/admin/analytics/department/route.js
import { NextResponse } from 'next/server';
const { query } = require('../../../../../lib/db');
const { requireAuth } = require('../../../../../lib/auth');

export async function GET(request) {
  try {
    requireAuth(request, ['admin', 'recruiter']);
    const res = await query('SELECT * FROM v_department_placement ORDER BY placement_percentage DESC');
    return NextResponse.json({ departments: res.rows });
  } catch (err) {
    console.error('Department analytics error:', err);
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  }
}
