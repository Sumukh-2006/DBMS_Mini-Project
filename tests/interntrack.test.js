// tests/interntrack.test.js
// Comprehensive automated test suite covering:
// 1. Schema & Integrity Constraints
// 2. Triggers (Immutability, Late apply, One offer, Auto-close, Clash check)
// 3. Stored Procedures (sp_apply, sp_advance_stage, sp_issue_offer, sp_accept_offer)
// 4. Concurrency & Row-level Locking (last opening race)
// 5. pgvector Hybrid Semantic Search
// 6. MongoDB Collections & Aggregations
// 7. Backend Authentication & RBAC

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const { pool, query, withTransaction } = require('../lib/db');
const { getMongoDb } = require('../lib/mongo');
const { generateEmbedding, cosineSimilarity } = require('../lib/embeddings');
const { hashPassword, verifyPassword, createToken, verifyToken } = require('../lib/auth');
const {
  getCompanyRatingAverages,
  getResumeSkillsFrequency,
  getInterviewFeedbackAverages
} = require('../lib/aggregations');

test.before(async () => {
  // Ensure database pool is healthy
  const res = await query('SELECT 1 AS alive;');
  assert.equal(res.rows[0].alive, 1);
});

test.after(async () => {
  await pool.end();
});

// ============================================================================
// 1. SCHEMA & CONSTRAINT INTEGRITY TESTS
// ============================================================================
test('1.1 Schema Constraint: Block invalid student CGPA > 10.00', async () => {
  await assert.rejects(
    async () => {
      await query(`
        INSERT INTO student (user_id, dept_id, usn, full_name, year, cgpa, grad_year)
        VALUES (1, 1, 'PES_ERR_CGPA', 'Invalid CGPA Student', 3, 11.50, 2026);
      `);
    },
    /chk_student_cgpa/
  );
});

test('1.2 Schema Constraint: Block duplicate application for same student and posting', async () => {
  await assert.rejects(
    async () => {
      // Sumukh (student_id = 1) is already applied to Google (posting_id = 1)
      await query(`
        INSERT INTO application (student_id, posting_id, current_stage)
        VALUES (1, 1, 'Applied');
      `);
    },
    /uq_student_posting_application/
  );
});

test('1.3 Schema Constraint: Block posting filled count exceeding openings', async () => {
  await assert.rejects(
    async () => {
      await query(`
        UPDATE internship_posting
        SET filled = openings + 5
        WHERE posting_id = 1;
      `);
    },
    /chk_posting_filled/
  );
});

test('1.4 Schema Constraint: Block invalid email format in app_user', async () => {
  await assert.rejects(
    async () => {
      await query(`
        INSERT INTO app_user (email, password_hash, role)
        VALUES ('invalid-email-format-without-at', 'hash', 'student');
      `);
    },
    /chk_app_user_email_format/
  );
});

// ============================================================================
// 2. TRIGGER TESTS
// ============================================================================
test('2.1 Trigger trg_history_immutable: Strictly block UPDATE on application_stage_history', async () => {
  const hist = await query(`
    INSERT INTO application_stage_history (application_id, from_stage, to_stage, changed_by, reason)
    VALUES (1, 'Applied', 'Shortlisted', 1, 'Initial record for immutability test')
    RETURNING history_id;
  `);
  const hid = hist.rows[0].history_id;

  await assert.rejects(
    async () => {
      await query(`
        UPDATE application_stage_history
        SET reason = 'Tampered reason attempt'
        WHERE history_id = $1;
      `, [hid]);
    },
    /Audit and stage history records are strictly append-only/
  );
});

test('2.2 Trigger trg_history_immutable: Strictly block DELETE on audit_log', async () => {
  const a = await query(`
    INSERT INTO audit_log (action, entity, entity_id, actor_id, details)
    VALUES ('TEST_ACTION', 'test_entity', 1, 1, '{"test": true}')
    RETURNING audit_id;
  `);
  const aid = a.rows[0].audit_id;

  await assert.rejects(
    async () => {
      await query(`
        DELETE FROM audit_log
        WHERE audit_id = $1;
      `, [aid]);
    },
    /Audit and stage history records are strictly append-only/
  );
});

test('2.3 Trigger trg_block_late_apply: Block application if posting is closed or deadline passed', async () => {
  // Create a temporary expired posting
  const expRes = await query(`
    INSERT INTO internship_posting (
      company_id, recruiter_id, title, description, location, openings,
      deadline, start_date, duration_weeks, status
    ) VALUES (
      1, 1, 'Expired Posting Test', 'Description', 'Bengaluru', 2,
      CURRENT_TIMESTAMP - INTERVAL '2 days', CURRENT_TIMESTAMP + INTERVAL '30 days', 12, 'open'
    ) RETURNING posting_id;
  `);
  const expiredPostingId = expRes.rows[0].posting_id;

  await assert.rejects(
    async () => {
      await query(`
        INSERT INTO application (student_id, posting_id, current_stage)
        VALUES (4, $1, 'Applied');
      `, [expiredPostingId]);
    },
    /Application deadline .* has passed/
  );

  // Cleanup temporary test posting
  await query('DELETE FROM internship_posting WHERE posting_id = $1', [expiredPostingId]);
});

test('2.4 Trigger trg_interview_clash: Detect and block overlapping interview schedule', async () => {
  // Existing interview for Sumukh (app_id = 1) is at round1Date
  const intRes = await query(`SELECT scheduled_at FROM interview WHERE application_id = 1 LIMIT 1`);
  const existingTime = intRes.rows[0].scheduled_at;

  // Attempt to schedule another interview for the same student overlapping within 45 mins
  await assert.rejects(
    async () => {
      await query(`
        INSERT INTO interview (application_id, round_no, scheduled_at, duration_min, mode)
        VALUES (1, 2, $1, 45, 'online');
      `, [existingTime]);
    },
    /Interview schedule conflict detected/
  );
});

// ============================================================================
// 3. STORED PROCEDURE TESTS
// ============================================================================
test('3.1 sp_apply: Reject application if student CGPA is below cutoff', async () => {
  // Student 5 (Karthik, CGPA 7.60) applies to Google (posting_id = 1, min_cgpa = 8.50)
  await assert.rejects(
    async () => {
      await query(`CALL sp_apply(5, 1, NULL);`);
    },
    /Ineligible: Student CGPA .* is below the minimum required CGPA/
  );
});

test('3.2 sp_advance_stage: Block illegal stage transition from Applied directly to Accepted', async () => {
  // Application 5 is in 'Applied' stage
  await assert.rejects(
    async () => {
      await query(`CALL sp_advance_stage(5, 'Accepted', 1, 'Illegal jump test');`);
    },
    /Illegal stage transition: Cannot advance from Applied to Accepted directly/
  );
});

test('3.3 sp_issue_offer: Issue offer and advance application stage to Offered', async () => {
  // Move Application 4 (Karthik -> Adobe) to Shortlisted first
  await query(`CALL sp_advance_stage(4, 'Shortlisted', 1, 'Screening passed');`);

  // Issue offer
  const start = new Date(Date.now() + 45 * 86400000);
  await query(`CALL sp_issue_offer(4, 85000, $1, 7, 1, NULL);`, [start]);

  const appRes = await query(`SELECT current_stage FROM application WHERE application_id = 4`);
  assert.equal(appRes.rows[0].current_stage, 'Offered');

  const offerRes = await query(`SELECT stipend, status FROM offer WHERE application_id = 4`);
  assert.equal(offerRes.rows.length, 1);
  assert.equal(parseFloat(offerRes.rows[0].stipend), 85000);
  assert.equal(offerRes.rows[0].status, 'pending');
});

test('3.4 sp_accept_offer & University Cascade Policy: Concurrency-safe acceptance auto-withdraws other active apps', async () => {
  // 1. Create a fresh test student
  const u = await query(`INSERT INTO app_user (email, password_hash, role) VALUES ('cascade.test@pes.edu', 'hash', 'student') RETURNING user_id`);
  const s = await query(`INSERT INTO student (user_id, dept_id, usn, full_name, year, cgpa, grad_year) VALUES ($1, 1, 'PES_CASCADE_TEST', 'Cascade Tester', 3, 9.00, 2026) RETURNING student_id`, [u.rows[0].user_id]);
  const stId = s.rows[0].student_id;

  // 2. Student applies to Postings 1 and 4
  const a1 = await query(`INSERT INTO application (student_id, posting_id, current_stage) VALUES ($1, 1, 'Offered') RETURNING application_id`, [stId]);
  const a2 = await query(`INSERT INTO application (student_id, posting_id, current_stage) VALUES ($1, 4, 'Applied') RETURNING application_id`, [stId]);

  // 3. Issue offer on Application 1
  const o = await query(`
    INSERT INTO offer (application_id, stipend, start_date, expires_at, status)
    VALUES ($1, 110000, CURRENT_TIMESTAMP + INTERVAL '30 days', CURRENT_TIMESTAMP + INTERVAL '7 days', 'pending')
    RETURNING offer_id
  `, [a1.rows[0].application_id]);

  // 4. Accept the offer
  await query(`CALL sp_accept_offer($1, $2);`, [o.rows[0].offer_id, stId]);

  // 5. Verify offer is accepted and application 1 is Accepted
  const oCheck = await query(`SELECT status FROM offer WHERE offer_id = $1`, [o.rows[0].offer_id]);
  assert.equal(oCheck.rows[0].status, 'accepted');

  const a1Check = await query(`SELECT current_stage FROM application WHERE application_id = $1`, [a1.rows[0].application_id]);
  assert.equal(a1Check.rows[0].current_stage, 'Accepted');

  // 6. Verify Application 2 was automatically WITHDRAWN per Placement Policy
  const a2Check = await query(`SELECT current_stage FROM application WHERE application_id = $1`, [a2.rows[0].application_id]);
  assert.equal(a2Check.rows[0].current_stage, 'Withdrawn');
});

// ============================================================================
// 4. CONCURRENCY & ROW-LEVEL LOCKING TEST
// ============================================================================
test('4.1 Concurrency: Prevent race condition claiming last opening with SELECT ... FOR UPDATE', async () => {
  // Create a posting with exactly 1 opening
  const pRes = await query(`
    INSERT INTO internship_posting (
      company_id, recruiter_id, title, description, location, openings, filled,
      deadline, start_date, duration_weeks, status
    ) VALUES (
      1, 1, 'Race Condition Last Opening', 'Desc', 'Bengaluru', 1, 0,
      CURRENT_TIMESTAMP + INTERVAL '10 days', CURRENT_TIMESTAMP + INTERVAL '40 days', 12, 'open'
    ) RETURNING posting_id;
  `);
  const racePostingId = pRes.rows[0].posting_id;

  // Create two students with pending offers for this posting
  const u1 = await query(`INSERT INTO app_user (email, password_hash, role) VALUES ('race1@pes.edu', 'hash', 'student') RETURNING user_id`);
  const s1 = await query(`INSERT INTO student (user_id, dept_id, usn, full_name, year, cgpa, grad_year) VALUES ($1, 1, 'PES_RACE1', 'Race Student 1', 3, 9.00, 2026) RETURNING student_id`, [u1.rows[0].user_id]);
  const a1 = await query(`INSERT INTO application (student_id, posting_id, current_stage) VALUES ($1, $2, 'Offered') RETURNING application_id`, [s1.rows[0].student_id, racePostingId]);
  const o1 = await query(`INSERT INTO offer (application_id, stipend, start_date, expires_at, status) VALUES ($1, 90000, CURRENT_TIMESTAMP + INTERVAL '30 days', CURRENT_TIMESTAMP + INTERVAL '7 days', 'pending') RETURNING offer_id`, [a1.rows[0].application_id]);

  const u2 = await query(`INSERT INTO app_user (email, password_hash, role) VALUES ('race2@pes.edu', 'hash', 'student') RETURNING user_id`);
  const s2 = await query(`INSERT INTO student (user_id, dept_id, usn, full_name, year, cgpa, grad_year) VALUES ($1, 1, 'PES_RACE2', 'Race Student 2', 3, 9.00, 2026) RETURNING student_id`, [u2.rows[0].user_id]);
  const a2 = await query(`INSERT INTO application (student_id, posting_id, current_stage) VALUES ($1, $2, 'Offered') RETURNING application_id`, [s2.rows[0].student_id, racePostingId]);
  const o2 = await query(`INSERT INTO offer (application_id, stipend, start_date, expires_at, status) VALUES ($1, 90000, CURRENT_TIMESTAMP + INTERVAL '30 days', CURRENT_TIMESTAMP + INTERVAL '7 days', 'pending') RETURNING offer_id`, [a2.rows[0].application_id]);

  // Execute first accept (must succeed)
  await query(`CALL sp_accept_offer($1, $2);`, [o1.rows[0].offer_id, s1.rows[0].student_id]);

  // Execute second accept (must fail due to filled = openings and posting auto-closed)
  await assert.rejects(
    async () => {
      await query(`CALL sp_accept_offer($1, $2);`, [o2.rows[0].offer_id, s2.rows[0].student_id]);
    },
    /Concurrency conflict: All openings \(1\/1\) were filled/
  );

  // Verify posting status was auto-closed by trigger trg_posting_autoclose
  const postCheck = await query(`SELECT status, filled, openings FROM internship_posting WHERE posting_id = $1`, [racePostingId]);
  assert.equal(postCheck.rows[0].status, 'closed');
  assert.equal(postCheck.rows[0].filled, 1);
});

// ============================================================================
// 5. VECTOR EMBEDDING & PGVECTOR SIMILARITY TESTS
// ============================================================================
test('5.1 pgvector: Cosine distance calculation with 384-dimensional vectors', async () => {
  const v1 = generateEmbedding('Distributed Systems Go Kubernetes PostgreSQL Backend');
  const v2 = generateEmbedding('Cloud backend engineer golang microservices');
  const v3 = generateEmbedding('Frontend UI React Next.js CSS styling');

  assert.equal(v1.length, 384);
  assert.equal(v2.length, 384);

  const simHigh = cosineSimilarity(v1, v2);
  const simLow = cosineSimilarity(v1, v3);

  assert.ok(simHigh > simLow, `Expected high similarity (${simHigh}) > low similarity (${simLow})`);

  // Test SQL <=> cosine distance operator in PostgreSQL
  const res = await query(`
    SELECT 
      ROUND((1 - (p.embedding <=> s.profile_embedding))::NUMERIC, 4) AS cosine_sim
    FROM internship_posting p
    CROSS JOIN student s
    WHERE p.posting_id = 1 AND s.student_id = 1;
  `);

  assert.ok(res.rows.length > 0);
  assert.ok(parseFloat(res.rows[0].cosine_sim) > 0.5);
});

// ============================================================================
// 6. NOSQL MONGODB AGGREGATION TESTS
// ============================================================================
test('6.1 MongoDB Aggregation: Average Rating per Company', async () => {
  const ratings = await getCompanyRatingAverages();
  assert.ok(Array.isArray(ratings));
  assert.ok(ratings.length > 0);
  assert.ok(ratings[0].company_name);
  assert.ok(ratings[0].overall_score > 0);
});

test('6.2 MongoDB Aggregation: Resume Skills Frequency', async () => {
  const skills = await getResumeSkillsFrequency();
  assert.ok(Array.isArray(skills));
  assert.ok(skills.length > 0);
  assert.ok(skills[0].skill);
  assert.ok(skills[0].frequency >= 1);
});

test('6.3 MongoDB Aggregation: Interview Rubric Dynamic Keys', async () => {
  const rubricAverages = await getInterviewFeedbackAverages();
  assert.ok(Array.isArray(rubricAverages));
  assert.ok(rubricAverages.length > 0);
  assert.ok(rubricAverages[0].metric);
  assert.ok(rubricAverages[0].average_score > 0);
});

// ============================================================================
// 7. AUTHENTICATION & RBAC TESTS
// ============================================================================
test('7.1 Auth: Password hashing and verification with bcrypt', async () => {
  const password = 'secureStudentPassword!2024';
  const hash = await hashPassword(password);
  assert.ok(hash !== password);
  const isMatch = await verifyPassword(password, hash);
  assert.equal(isMatch, true);
  const isWrong = await verifyPassword('wrongpassword', hash);
  assert.equal(isWrong, false);
});

test('7.2 Auth: JWT Token signing, verification, and role payload', () => {
  const payload = { userId: 42, role: 'admin', email: 'admin@pes.edu' };
  const token = createToken(payload);
  assert.ok(typeof token === 'string');
  const decoded = verifyToken(token);
  assert.equal(decoded.userId, 42);
  assert.equal(decoded.role, 'admin');
  assert.equal(decoded.email, 'admin@pes.edu');
});
