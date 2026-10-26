// app/api/admin/dashboard/route.js
import { NextResponse } from 'next/server';
const { query } = require('../../../../lib/db');
const { requireAuth } = require('../../../../lib/auth');

export async function GET(request) {
  try {
    requireAuth(request, ['admin']);

    // Total counts
    const countsRes = await query(`
      SELECT 
        (SELECT COUNT(*) FROM student) AS total_students,
        (SELECT COUNT(*) FROM company) AS total_companies,
        (SELECT COUNT(*) FROM company WHERE verified = FALSE) AS pending_verifications,
        (SELECT COUNT(*) FROM internship_posting WHERE status = 'open') AS open_postings,
        (SELECT COUNT(*) FROM application) AS total_applications,
        (SELECT COUNT(*) FROM offer WHERE status = 'accepted') AS total_placed
    `);

    // Placement percentage and stipend stats
    const stipendRes = await query(`
      SELECT 
        ROUND(COALESCE(AVG(stipend), 0), 2) AS avg_stipend,
        COALESCE(MAX(stipend), 0) AS max_stipend,
        COALESCE(MIN(stipend), 0) AS min_stipend
      FROM offer
      WHERE status = 'accepted';
    `);

    // Top companies stats from view
    const companyStatsRes = await query(`
      SELECT * FROM v_company_stats ORDER BY total_offers_accepted DESC, total_applicants DESC LIMIT 5;
    `);

    // Department placement from view
    const deptRes = await query(`
      SELECT * FROM v_department_placement ORDER BY placement_percentage DESC;
    `);

    return NextResponse.json({
      metrics: countsRes.rows[0],
      stipendStats: stipendRes.rows[0],
      topCompanies: companyStatsRes.rows,
      departmentStats: deptRes.rows,
    });
  } catch (err) {
    console.error('Admin dashboard error:', err);
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  }
}
