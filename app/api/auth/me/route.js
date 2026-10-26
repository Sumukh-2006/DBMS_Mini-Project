// app/api/auth/me/route.js
import { NextResponse } from 'next/server';
const { query } = require('../../../../lib/db');
const { getUserFromRequest } = require('../../../../lib/auth');

export async function GET(request) {
  try {
    const session = getUserFromRequest(request);
    if (!session) {
      return NextResponse.json({ authenticated: false, user: null });
    }

    let profile = {
      userId: session.userId,
      email: session.email,
      role: session.role,
    };

    if (session.role === 'student') {
      const res = await query(
        `SELECT s.student_id, s.usn, s.full_name, s.cgpa, s.year, s.grad_year, s.phone, s.about,
                d.dept_id, d.code AS dept_code, d.name AS dept_name
         FROM student s
         JOIN department d ON s.dept_id = d.dept_id
         WHERE s.user_id = $1`,
        [session.userId]
      );
      if (res.rows.length > 0) profile = { ...profile, ...res.rows[0] };
    } else if (session.role === 'recruiter') {
      const res = await query(
        `SELECT r.recruiter_id, r.designation, c.company_id, c.name AS company_name, c.industry, c.verified
         FROM recruiter r
         JOIN company c ON r.company_id = c.company_id
         WHERE r.user_id = $1`,
        [session.userId]
      );
      if (res.rows.length > 0) profile = { ...profile, ...res.rows[0] };
    } else if (session.role === 'admin') {
      profile.fullName = 'Placement Administrator';
    }

    return NextResponse.json({ authenticated: true, user: profile });
  } catch (err) {
    console.error('Auth check error:', err);
    return NextResponse.json({ authenticated: false, user: null }, { status: 500 });
  }
}
