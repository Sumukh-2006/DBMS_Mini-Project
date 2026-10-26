// app/api/auth/login/route.js
import { NextResponse } from 'next/server';
const { query } = require('../../../../lib/db');
const { verifyPassword, createToken, COOKIE_NAME } = require('../../../../lib/auth');

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    // 1. Fetch user from PostgreSQL
    const userRes = await query(
      `SELECT user_id, email, password_hash, role, is_active FROM app_user WHERE email = $1`,
      [email.toLowerCase().trim()]
    );

    if (userRes.rows.length === 0) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const user = userRes.rows[0];

    if (!user.is_active) {
      return NextResponse.json({ error: 'Account has been deactivated. Please contact administrator.' }, { status: 403 });
    }

    // 2. Verify password with bcrypt
    const isMatch = await verifyPassword(password, user.password_hash);
    if (!isMatch) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // 3. Fetch role-specific details
    let profile = {
      userId: user.user_id,
      email: user.email,
      role: user.role,
    };

    if (user.role === 'student') {
      const stRes = await query(
        `SELECT s.student_id, s.usn, s.full_name, s.cgpa, s.year, s.grad_year, d.code AS dept_code, d.name AS dept_name
         FROM student s
         JOIN department d ON s.dept_id = d.dept_id
         WHERE s.user_id = $1`,
        [user.user_id]
      );
      if (stRes.rows.length > 0) {
        profile = { ...profile, ...stRes.rows[0] };
      }
    } else if (user.role === 'recruiter') {
      const recRes = await query(
        `SELECT r.recruiter_id, r.designation, c.company_id, c.name AS company_name, c.verified
         FROM recruiter r
         JOIN company c ON r.company_id = c.company_id
         WHERE r.user_id = $1`,
        [user.user_id]
      );
      if (recRes.rows.length > 0) {
        profile = { ...profile, ...recRes.rows[0] };
      }
    }

    // 4. Create JWT token
    const token = createToken({
      userId: user.user_id,
      email: user.email,
      role: user.role,
      studentId: profile.student_id || null,
      recruiterId: profile.recruiter_id || null,
      companyId: profile.company_id || null,
    });

    // 5. Build response and set HTTP-only cookie
    const response = NextResponse.json({
      message: 'Login successful',
      user: profile,
    });

    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (err) {
    console.error('Login error:', err);
    return NextResponse.json({ error: 'Internal server error during authentication' }, { status: 500 });
  }
}
