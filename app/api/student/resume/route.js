// app/api/student/resume/route.js
import { NextResponse } from 'next/server';
const { query } = require('../../../../lib/db');
const { requireAuth } = require('../../../../lib/auth');
const { getMongoDb } = require('../../../../lib/mongo');
const { generateEmbedding, vectorToSql } = require('../../../../lib/embeddings');

export async function POST(request) {
  try {
    const user = requireAuth(request, ['student']);
    const body = await request.json();
    const { rawText, parsedData } = body;

    const stRes = await query('SELECT student_id, full_name, about FROM student WHERE user_id = $1', [user.userId]);
    const student = stRes.rows[0];

    // Extract skills present in the raw text or parsed projects
    const allSkillsRes = await query('SELECT skill_id, name FROM skill');
    const detectedSkills = [];
    const textToScan = `${rawText || ''} ${JSON.stringify(parsedData || {})}`.toLowerCase();

    for (const sk of allSkillsRes.rows) {
      if (textToScan.includes(sk.name.toLowerCase())) {
        detectedSkills.push(sk.name);
      }
    }

    // Save to MongoDB collection `resumes`
    const mongoDb = await getMongoDb();
    await mongoDb.collection('resumes').updateOne(
      { student_id: student.student_id },
      {
        $set: {
          student_id: student.student_id,
          uploaded_at: new Date(),
          raw_text: rawText || '',
          parsed: parsedData || { education: [], projects: [], experience: [], certifications: [] },
          extracted_skills: detectedSkills,
        }
      },
      { upsert: true }
    );

    // Recompute embedding with detected skills
    const combinedText = `${student.full_name} ${student.about || ''} ${detectedSkills.join(' ')}`;
    const embedding = generateEmbedding(combinedText);

    await query(
      `UPDATE student SET profile_embedding = $1::vector WHERE student_id = $2`,
      [vectorToSql(embedding), student.student_id]
    );

    return NextResponse.json({
      message: 'Resume parsed and stored in MongoDB. Profile vector embedding updated.',
      extractedSkills: detectedSkills,
    });
  } catch (err) {
    console.error('Resume upload error:', err);
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  }
}
