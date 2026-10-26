// app/api/auth/register/route.js
import { NextResponse } from 'next/server';
const { withTransaction, query } = require('../../../../lib/db');
const { hashPassword, createToken, COOKIE_NAME } = require('../../../../lib/auth');
const { generateEmbedding, vectorToSql } = require('../../../../lib/embeddings');
const { getMongoDb } = require('../../../../lib/mongo');

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password, role, ...details } = body;

    if (!email || !password || !role) {
      return NextResponse.json({ error: 'Email, password, and role are required' }, { status: 400 });
    }

    if (!['student', 'recruiter'].includes(role)) {
      return NextResponse.json({ error: 'Role must be student or recruiter' }, { status: 400 });
    }

    // Check if email already exists
    const existing = await query('SELECT user_id FROM app_user WHERE email = $1', [email.toLowerCase().trim()]);
    if (existing.rows.length > 0) {
      return NextResponse.json({ error: 'An account with this email address already exists' }, { status: 409 });
    }

    const hashedPassword = await hashPassword(password);
    let createdUser;

    await withTransaction(async (client) => {
      // 1. Create app_user
      const uRes = await client.query(
        `INSERT INTO app_user (email, password_hash, role) VALUES ($1, $2, $3) RETURNING user_id, email, role`,
        [email.toLowerCase().trim(), hashedPassword, role]
      );
      const user = uRes.rows[0];

      if (role === 'student') {
        const { usn, fullName, deptId, year, cgpa, gradYear, phone, about } = details;
        if (!usn || !fullName || !deptId || !cgpa) {
          throw new Error('USN, Full Name, Department, and CGPA are mandatory for student registration');
        }

        const profileText = `${fullName} ${about || ''}`;
        const embedding = generateEmbedding(profileText);

        const stRes = await client.query(
          `INSERT INTO student (user_id, dept_id, usn, full_name, year, cgpa, grad_year, phone, about, profile_embedding)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::vector) RETURNING student_id, usn, full_name`,
          [
            user.user_id,
            parseInt(deptId),
            usn.toUpperCase().trim(),
            fullName.trim(),
            parseInt(year) || 3,
            parseFloat(cgpa),
            parseInt(gradYear) || 2026,
            phone || null,
            about || null,
            vectorToSql(embedding)
          ]
        );

        createdUser = {
          userId: user.user_id,
          email: user.email,
          role: user.role,
          studentId: stRes.rows[0].student_id,
          usn: stRes.rows[0].usn,
          fullName: stRes.rows[0].full_name,
        };

        // Initialize MongoDB resume placeholder
        const mongoDb = await getMongoDb();
        await mongoDb.collection('resumes').insertOne({
          student_id: stRes.rows[0].student_id,
          uploaded_at: new Date(),
          raw_text: `${fullName} - ${usn}`,
          parsed: { education: [], projects: [], experience: [], certifications: [] },
          extracted_skills: []
        });

      } else if (role === 'recruiter') {
        const { companyName, industry, website, designation } = details;
        if (!companyName || !designation) {
          throw new Error('Company name and designation are mandatory for recruiter registration');
        }

        // Check if company exists or create unverified
        let companyId;
        const compRes = await client.query(`SELECT company_id FROM company WHERE LOWER(name) = $1`, [companyName.toLowerCase().trim()]);
        if (compRes.rows.length > 0) {
          companyId = compRes.rows[0].company_id;
        } else {
          const newComp = await client.query(
            `INSERT INTO company (name, industry, website, verified) VALUES ($1, $2, $3, FALSE) RETURNING company_id`,
            [companyName.trim(), industry || 'Technology', website || null]
          );
          companyId = newComp.rows[0].company_id;
        }

        const recRes = await client.query(
          `INSERT INTO recruiter (user_id, company_id, designation) VALUES ($1, $2, $3) RETURNING recruiter_id`,
          [user.user_id, companyId, designation.trim()]
        );

        createdUser = {
          userId: user.user_id,
          email: user.email,
          role: user.role,
          recruiterId: recRes.rows[0].recruiter_id,
          companyId,
          companyName,
        };
      }
    });

    const token = createToken({
      userId: createdUser.userId,
      email: createdUser.email,
      role: createdUser.role,
      studentId: createdUser.studentId || null,
      recruiterId: createdUser.recruiterId || null,
      companyId: createdUser.companyId || null,
    });

    const response = NextResponse.json({
      message: 'Account registered successfully',
      user: createdUser,
    }, { status: 201 });

    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (err) {
    console.error('Registration error:', err);
    return NextResponse.json({ error: err.message || 'Registration failed' }, { status: 400 });
  }
}
