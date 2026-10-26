// app/api/admin/reports/export/route.js
import { NextResponse } from 'next/server';
const { query } = require('../../../../../lib/db');
const { requireAuth } = require('../../../../../lib/auth');

export async function GET(request) {
  try {
    requireAuth(request, ['admin']);
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'placements';

    let csvContent = '';
    let filename = `interntrack_${type}_${new Date().toISOString().slice(0, 10)}.csv`;

    if (type === 'placements') {
      const res = await query(`
        SELECT 
          s.usn,
          s.full_name AS student_name,
          d.code AS department,
          s.cgpa,
          c.name AS company_name,
          p.title AS posting_title,
          o.stipend,
          o.start_date,
          o.responded_at AS placed_at
        FROM offer o
        JOIN application a ON o.application_id = a.application_id
        JOIN student s ON a.student_id = s.student_id
        JOIN department d ON s.dept_id = d.dept_id
        JOIN internship_posting p ON a.posting_id = p.posting_id
        JOIN company c ON p.company_id = c.company_id
        WHERE o.status = 'accepted'
        ORDER BY o.responded_at DESC;
      `);

      csvContent = 'USN,Student Name,Department,CGPA,Company,Posting Title,Stipend,Start Date,Placed At\n';
      res.rows.forEach(r => {
        csvContent += `"${r.usn}","${r.student_name}","${r.department}",${r.cgpa},"${r.company_name}","${r.posting_title}",${r.stipend},"${new Date(r.start_date).toLocaleDateString()}","${new Date(r.placed_at).toLocaleDateString()}"\n`;
      });

    } else if (type === 'applications') {
      const res = await query(`
        SELECT 
          a.application_id,
          s.usn,
          s.full_name AS student_name,
          c.name AS company_name,
          p.title AS posting_title,
          a.current_stage,
          a.match_score,
          a.applied_at
        FROM application a
        JOIN student s ON a.student_id = s.student_id
        JOIN internship_posting p ON a.posting_id = p.posting_id
        JOIN company c ON p.company_id = c.company_id
        ORDER BY a.applied_at DESC;
      `);

      csvContent = 'Application ID,USN,Student Name,Company,Posting Title,Current Stage,Match Score,Applied At\n';
      res.rows.forEach(r => {
        csvContent += `${r.application_id},"${r.usn}","${r.student_name}","${r.company_name}","${r.posting_title}","${r.current_stage}",${r.match_score},"${new Date(r.applied_at).toLocaleDateString()}"\n`;
      });

    } else if (type === 'companies') {
      const res = await query(`SELECT * FROM v_company_stats ORDER BY total_offers_accepted DESC;`);
      csvContent = 'Company ID,Company Name,Industry,Verified,Total Postings,Active Postings,Total Applicants,Total Offers Issued,Total Offers Accepted,Acceptance Rate (%)\n';
      res.rows.forEach(r => {
        csvContent += `${r.company_id},"${r.company_name}","${r.industry}",${r.verified},${r.total_postings},${r.active_postings},${r.total_applicants},${r.total_offers_issued},${r.total_offers_accepted},${r.offer_acceptance_rate_pct}\n`;
      });
    }

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    console.error('Export report error:', err);
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  }
}
