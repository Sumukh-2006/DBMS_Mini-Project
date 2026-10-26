// app/api/reviews/route.js
import { NextResponse } from 'next/server';
const { requireAuth } = require('../../../lib/auth');
const { getMongoDb } = require('../../../lib/mongo');
const { query } = require('../../../lib/db');

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('companyId');

    const mongoDb = await getMongoDb();
    let filter = {};
    if (companyId) {
      filter.company_id = parseInt(companyId);
    }

    const reviews = await mongoDb.collection('experience_reviews')
      .find(filter)
      .sort({ created_at: -1 })
      .limit(50)
      .toArray();

    return NextResponse.json({ reviews });
  } catch (err) {
    console.error('Fetch reviews error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = requireAuth(request, ['student']);
    const body = await request.json();
    const { companyId, postingId, ratings, text, tags } = body;

    if (!companyId || !ratings || !text) {
      return NextResponse.json({ error: 'Company, ratings, and review text are required' }, { status: 400 });
    }

    const stRes = await query('SELECT student_id, full_name FROM student WHERE user_id = $1', [user.userId]);
    const student = stRes.rows[0];

    const compRes = await query('SELECT name FROM company WHERE company_id = $1', [companyId]);
    const companyName = compRes.rows.length > 0 ? compRes.rows[0].name : 'Company';

    const mongoDb = await getMongoDb();
    const reviewDoc = {
      company_id: parseInt(companyId),
      company_name: companyName,
      posting_id: postingId ? parseInt(postingId) : null,
      student_id: student.student_id,
      student_name: student.full_name,
      ratings: {
        mentorship: parseFloat(ratings.mentorship) || 5,
        learning: parseFloat(ratings.learning) || 5,
        work_life_balance: parseFloat(ratings.work_life_balance) || 4,
        compensation: parseFloat(ratings.compensation) || 5,
      },
      text: text.trim(),
      tags: Array.isArray(tags) ? tags : [],
      created_at: new Date(),
    };

    const result = await mongoDb.collection('experience_reviews').insertOne(reviewDoc);

    return NextResponse.json({
      message: 'Experience review submitted successfully to MongoDB',
      reviewId: result.insertedId,
    }, { status: 201 });
  } catch (err) {
    console.error('Post review error:', err);
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  }
}
