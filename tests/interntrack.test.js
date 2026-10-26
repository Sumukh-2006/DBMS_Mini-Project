// tests/interntrack.test.js
// Comprehensive automated test suite covering:
// 1. Schema & Integrity Constraints (CGPA check, Duplicate application, Filled vs Openings, Email regex)
// 2. Triggers (Immutability, Late apply, One offer, Auto-close, Clash check, Single accepted app)
// 3. Stored Procedures (sp_apply, sp_advance_stage, sp_issue_offer, sp_accept_offer, sp_expire_offers)
// 4. Concurrency & Row-level Locking (Scenario A: last opening race, Scenario B: dual offer accept, Scenario C: idempotency)
// 5. pgvector Hybrid Semantic Search (Cosine distance <=> calculation, HNSW query)
// 6. MongoDB Collections & Aggregations (Company averages, Skills frequency, Rubric dynamic keys)
// 7. Backend Authentication, RBAC & Materialized View Refresh

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const { pool, query, getClient } = require('../lib/db');
const { getMongoDb, closeMongoConnection } = require('../lib/mongo');
const { generateEmbedding, cosineSimilarity } = require('../lib/embeddings');
const { hashPassword, verifyPassword, createToken, verifyToken, requireAuth } = require('../lib/auth');
const {
  getCompanyRatingAverages,
  getResumeSkillsFrequency,
  getInterviewFeedbackAverages,
  getActivityHeatmap,
  getTopReviewTags
} = require('../lib/aggregations');

let counter = 0;
function uniqueId(prefix = 't') {
  counter++;
  return `${prefix}_${Date.now()}_${counter}_${Math.floor(Math.random() * 10000)}`;
}

async function createTestStudent(cgpa = 9.00) {
  const uid = uniqueId('st');
  const u = await query(
    `INSERT INTO app_user (email, password_hash, role) VALUES ($1, 'hash', 'student') RETURNING user_id`,
    [`${uid}@pes.edu`]
  );
  const s = await query(
    `INSERT INTO student (user_id, dept_id, usn, full_name, year, cgpa, grad_year)
     VALUES ($1, 1, $2, 'Test Student', 3, $3, 2026) RETURNING student_id`,
    [u.rows[0].user_id, `U_${uid}`.slice(0, 30), cgpa]
  );
  return { userId: u.rows[0].user_id, studentId: s.rows[0].student_id };
}

async function createTestPosting(openings = 5, minCgpa = 0.00, status = 'open') {
  const pid = uniqueId('post');
  const res = await query(
    `INSERT INTO internship_posting (
      company_id, recruiter_id, title, description, location, openings, filled,
      deadline, start_date, duration_weeks, min_cgpa, status
    ) VALUES (
      1, 1, $1, 'Test Description', 'Bengaluru', $2, 0,
      CURRENT_TIMESTAMP + INTERVAL '10 days', CURRENT_TIMESTAMP + INTERVAL '40 days', 12, $3, $4
    ) RETURNING posting_id`,
    [`Posting ${pid}`, openings, minCgpa, status]
  );
  return res.rows[0].posting_id;
}

test.before(async () => {
  // Ensure database pool is healthy
  const res = await query('SELECT 1 AS alive;');
  assert.equal(res.rows[0].alive, 1);
});

test.after(async () => {
  // Cleanly close both MongoDB and PostgreSQL handles to prevent process hanging
  await closeMongoConnection();
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
  const { studentId } = await createTestStudent();
  const postingId = await createTestPosting();

  // First application succeeds
  await query(`INSERT INTO application (student_id, posting_id, current_stage) VALUES ($1, $2, 'Applied')`, [studentId, postingId]);

  // Second duplicate application must fail on unique constraint
  await assert.rejects(
    async () => {
      await query(`INSERT INTO application (student_id, posting_id, current_stage) VALUES ($1, $2, 'Applied')`, [studentId, postingId]);
    },
    /uq_student_posting_application/
  );
});

test('1.3 Schema Constraint: Block posting filled count exceeding openings', async () => {
  const postingId = await createTestPosting(2);
  await assert.rejects(
    async () => {
      await query(`
        UPDATE internship_posting
        SET filled = openings + 5
        WHERE posting_id = $1;
      `, [postingId]);
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
// 2. TRIGGER & ADVANCED DATABASE INVARIANT TESTS
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
  const { studentId } = await createTestStudent();

  await assert.rejects(
    async () => {
      await query(`
        INSERT INTO application (student_id, posting_id, current_stage)
        VALUES ($1, $2, 'Applied');
      `, [studentId, expiredPostingId]);
    },
    /Application deadline .* has passed/
  );
});

test('2.4 Trigger trg_interview_clash: Detect and block overlapping interview schedule', async () => {
  const { studentId } = await createTestStudent();
  const postingId = await createTestPosting();
  const a = await query(`INSERT INTO application (student_id, posting_id, current_stage) VALUES ($1, $2, 'Interview') RETURNING application_id`, [studentId, postingId]);
  const appId = a.rows[0].application_id;

  const interviewTime = new Date(Date.now() + 5 * 86400000);
  await query(`
    INSERT INTO interview (application_id, round_no, scheduled_at, duration_min, mode)
    VALUES ($1, 1, $2, 45, 'online');
  `, [appId, interviewTime]);

  await assert.rejects(
    async () => {
      await query(`
        INSERT INTO interview (application_id, round_no, scheduled_at, duration_min, mode)
        VALUES ($1, 2, $2, 45, 'online');
      `, [appId, interviewTime]);
    },
    /Interview schedule conflict detected/
  );
});

test('2.5 Partial Unique Index: uq_student_single_accepted_application blocks multiple accepted applications', async () => {
  const { studentId } = await createTestStudent();
  const post1 = await createTestPosting();
  const post2 = await createTestPosting();

  // First application accepted
  await query(`INSERT INTO application (student_id, posting_id, current_stage) VALUES ($1, $2, 'Accepted')`, [studentId, post1]);

  // Second application attempted directly to Accepted stage
  await assert.rejects(
    async () => {
      await query(`INSERT INTO application (student_id, posting_id, current_stage) VALUES ($1, $2, 'Accepted')`, [studentId, post2]);
    },
    /uq_student_single_accepted_application/
  );
});

// ============================================================================
// 3. STORED PROCEDURE TESTS
// ============================================================================
test('3.1 sp_apply: Reject application if student CGPA is below cutoff', async () => {
  const { studentId } = await createTestStudent(7.20);
  const postingId = await createTestPosting(3, 8.50);

  await assert.rejects(
    async () => {
      await query(`CALL sp_apply($1, $2, NULL);`, [studentId, postingId]);
    },
    /Ineligible: Student CGPA .* is below the minimum required CGPA/
  );
});

test('3.2 sp_advance_stage: Block illegal stage transition from Applied directly to Accepted', async () => {
  const { studentId } = await createTestStudent();
  const postingId = await createTestPosting();
  const a = await query(`INSERT INTO application (student_id, posting_id, current_stage) VALUES ($1, $2, 'Applied') RETURNING application_id`, [studentId, postingId]);

  await assert.rejects(
    async () => {
      await query(`CALL sp_advance_stage($1, 'Accepted', 1, 'Illegal jump test');`, [a.rows[0].application_id]);
    },
    /Illegal stage transition: Cannot advance from Applied to Accepted directly/
  );
});

test('3.3 sp_issue_offer: Issue offer and advance application stage to Offered', async () => {
  const { studentId } = await createTestStudent();
  const postingId = await createTestPosting();
  const a = await query(`INSERT INTO application (student_id, posting_id, current_stage) VALUES ($1, $2, 'Shortlisted') RETURNING application_id`, [studentId, postingId]);
  const appId = a.rows[0].application_id;

  const start = new Date(Date.now() + 45 * 86400000);
  await query(`CALL sp_issue_offer($1, 85000, $2, 7, 1, NULL);`, [appId, start]);

  const appRes = await query(`SELECT current_stage FROM application WHERE application_id = $1`, [appId]);
  assert.equal(appRes.rows[0].current_stage, 'Offered');

  const offerRes = await query(`SELECT stipend, status FROM offer WHERE application_id = $1`, [appId]);
  assert.equal(offerRes.rows.length, 1);
  assert.equal(parseFloat(offerRes.rows[0].stipend), 85000);
  assert.equal(offerRes.rows[0].status, 'pending');
});

test('3.4 sp_accept_offer & University Cascade Policy: Concurrency-safe acceptance auto-withdraws other active apps', async () => {
  const { studentId } = await createTestStudent();
  const post1 = await createTestPosting();
  const post2 = await createTestPosting();

  const a1 = await query(`INSERT INTO application (student_id, posting_id, current_stage) VALUES ($1, $2, 'Offered') RETURNING application_id`, [studentId, post1]);
  const a2 = await query(`INSERT INTO application (student_id, posting_id, current_stage) VALUES ($1, $2, 'Applied') RETURNING application_id`, [studentId, post2]);

  const o = await query(`
    INSERT INTO offer (application_id, stipend, start_date, expires_at, status)
    VALUES ($1, 110000, CURRENT_TIMESTAMP + INTERVAL '30 days', CURRENT_TIMESTAMP + INTERVAL '7 days', 'pending')
    RETURNING offer_id
  `, [a1.rows[0].application_id]);

  await query(`CALL sp_accept_offer($1, $2);`, [o.rows[0].offer_id, studentId]);

  const oCheck = await query(`SELECT status FROM offer WHERE offer_id = $1`, [o.rows[0].offer_id]);
  assert.equal(oCheck.rows[0].status, 'accepted');

  const a1Check = await query(`SELECT current_stage FROM application WHERE application_id = $1`, [a1.rows[0].application_id]);
  assert.equal(a1Check.rows[0].current_stage, 'Accepted');

  const a2Check = await query(`SELECT current_stage FROM application WHERE application_id = $1`, [a2.rows[0].application_id]);
  assert.equal(a2Check.rows[0].current_stage, 'Withdrawn');
});

test('3.5 sp_accept_offer: Expired offer rejection (Scenario D)', async () => {
  const { studentId } = await createTestStudent();
  const post = await createTestPosting();

  const a = await query(`INSERT INTO application (student_id, posting_id, current_stage) VALUES ($1, $2, 'Offered') RETURNING application_id`, [studentId, post]);
  const o = await query(`
    INSERT INTO offer (application_id, stipend, start_date, issued_at, expires_at, status)
    VALUES ($1, 75000, CURRENT_TIMESTAMP + INTERVAL '30 days', CURRENT_TIMESTAMP - INTERVAL '10 days', CURRENT_TIMESTAMP - INTERVAL '2 days', 'pending')
    RETURNING offer_id
  `, [a.rows[0].application_id]);

  await assert.rejects(
    async () => {
      await query(`CALL sp_accept_offer($1, $2);`, [o.rows[0].offer_id, studentId]);
    },
    /Offer has expired/
  );
});

// ============================================================================
// 4. CONCURRENCY & ROW-LEVEL LOCKING TESTS
// ============================================================================
test('4.1 Concurrency Scenario A: Prevent race condition claiming last opening with SELECT ... FOR UPDATE', async () => {
  const c1 = await getClient();
  const c2 = await getClient();
  try {
    const racePostingId = await createTestPosting(1);

    const { studentId: s1Id } = await createTestStudent();
    const a1 = await c1.query(`INSERT INTO application (student_id, posting_id, current_stage) VALUES ($1, $2, 'Offered') RETURNING application_id`, [s1Id, racePostingId]);
    const o1 = await c1.query(`INSERT INTO offer (application_id, stipend, start_date, expires_at, status) VALUES ($1, 90000, CURRENT_TIMESTAMP + INTERVAL '30 days', CURRENT_TIMESTAMP + INTERVAL '7 days', 'pending') RETURNING offer_id`, [a1.rows[0].application_id]);

    const { studentId: s2Id } = await createTestStudent();
    const a2 = await c1.query(`INSERT INTO application (student_id, posting_id, current_stage) VALUES ($1, $2, 'Offered') RETURNING application_id`, [s2Id, racePostingId]);
    const o2 = await c1.query(`INSERT INTO offer (application_id, stipend, start_date, expires_at, status) VALUES ($1, 90000, CURRENT_TIMESTAMP + INTERVAL '30 days', CURRENT_TIMESTAMP + INTERVAL '7 days', 'pending') RETURNING offer_id`, [a2.rows[0].application_id]);

    async function runTx(client, offerId, studentId) {
      try {
        await client.query('BEGIN');
        await client.query('CALL sp_accept_offer($1, $2)', [offerId, studentId]);
        await client.query('COMMIT');
        return { success: true };
      } catch (err) {
        await client.query('ROLLBACK').catch(() => {});
        return { success: false, error: err.message };
      }
    }

    // Genuinely concurrent parallel execution of sp_accept_offer across independent database connections
    const [r1, r2] = await Promise.all([
      runTx(c1, o1.rows[0].offer_id, s1Id),
      runTx(c2, o2.rows[0].offer_id, s2Id)
    ]);

    const successes = [r1, r2].filter(r => r.success);
    const failures = [r1, r2].filter(r => !r.success);

    assert.equal(successes.length, 1, 'Exactly one candidate must secure the final seat');
    assert.equal(failures.length, 1, 'The competing candidate must be safely rejected');
    assert.match(failures[0].error, /Concurrency conflict: All openings \(1\/1\) were filled/);

    const postCheck = await c1.query(`SELECT status, filled, openings FROM internship_posting WHERE posting_id = $1`, [racePostingId]);
    assert.equal(postCheck.rows[0].status, 'closed');
    assert.equal(postCheck.rows[0].filled, 1);
    assert.ok(postCheck.rows[0].filled <= postCheck.rows[0].openings, 'Filled seats must never exceed openings');

    const acceptedOffers = await c1.query(`SELECT count(*) AS cnt FROM offer WHERE offer_id IN ($1, $2) AND status = 'accepted'`, [o1.rows[0].offer_id, o2.rows[0].offer_id]);
    assert.equal(parseInt(acceptedOffers.rows[0].cnt), 1, 'Exactly one offer row must be accepted');

    const acceptedApps = await c1.query(`SELECT count(*) AS cnt FROM application WHERE application_id IN ($1, $2) AND current_stage = 'Accepted'`, [a1.rows[0].application_id, a2.rows[0].application_id]);
    assert.equal(parseInt(acceptedApps.rows[0].cnt), 1, 'Exactly one application stage must be Accepted');
  } finally {
    c1.release();
    c2.release();
  }
});

test('4.2 Concurrency Scenario B: One student accepts two offers in parallel with deadlock freedom', async () => {
  const c1 = await getClient();
  const c2 = await getClient();
  try {
    const postA = await createTestPosting(2);
    const postB = await createTestPosting(2);
    const { studentId: stId } = await createTestStudent();

    const a1 = await c1.query(`INSERT INTO application (student_id, posting_id, current_stage) VALUES ($1, $2, 'Offered') RETURNING application_id`, [stId, postA]);
    const a2 = await c1.query(`INSERT INTO application (student_id, posting_id, current_stage) VALUES ($1, $2, 'Offered') RETURNING application_id`, [stId, postB]);

    const o1 = await c1.query(`INSERT INTO offer (application_id, stipend, start_date, expires_at, status) VALUES ($1, 80000, CURRENT_TIMESTAMP + INTERVAL '30 days', CURRENT_TIMESTAMP + INTERVAL '7 days', 'pending') RETURNING offer_id`, [a1.rows[0].application_id]);
    const o2 = await c1.query(`INSERT INTO offer (application_id, stipend, start_date, expires_at, status) VALUES ($1, 90000, CURRENT_TIMESTAMP + INTERVAL '30 days', CURRENT_TIMESTAMP + INTERVAL '7 days', 'pending') RETURNING offer_id`, [a2.rows[0].application_id]);

    async function runTx(client, offerId) {
      try {
        await client.query('BEGIN');
        await client.query('CALL sp_accept_offer($1, $2)', [offerId, stId]);
        await client.query('COMMIT');
        return { success: true };
      } catch (err) {
        await client.query('ROLLBACK').catch(() => {});
        return { success: false, error: err.message };
      }
    }

    const [r1, r2] = await Promise.all([
      runTx(c1, o1.rows[0].offer_id),
      runTx(c2, o2.rows[0].offer_id)
    ]);

    const successes = [r1, r2].filter(r => r.success);
    const failures = [r1, r2].filter(r => !r.success);

    assert.equal(successes.length, 1, 'Exactly one transaction must succeed');
    assert.equal(failures.length, 1, 'Exactly one transaction must fail');
    assert.match(failures[0].error, /Offer is no longer pending/);

    const acceptedOffers = await c1.query(
      `SELECT * FROM offer WHERE application_id IN ($1, $2) AND status = 'accepted'`,
      [a1.rows[0].application_id, a2.rows[0].application_id]
    );
    assert.equal(acceptedOffers.rows.length, 1, 'Student must end with exactly 1 accepted offer');
  } finally {
    c1.release();
    c2.release();
  }
});

test('4.3 Idempotency Scenario C: Repeated acceptance request fails cleanly with controlled error', async () => {
  const { studentId: stId } = await createTestStudent();
  const post = await createTestPosting();

  const a = await query(`INSERT INTO application (student_id, posting_id, current_stage) VALUES ($1, $2, 'Offered') RETURNING application_id`, [stId, post]);
  const o = await query(`
    INSERT INTO offer (application_id, stipend, start_date, expires_at, status)
    VALUES ($1, 70000, CURRENT_TIMESTAMP + INTERVAL '30 days', CURRENT_TIMESTAMP + INTERVAL '7 days', 'pending')
    RETURNING offer_id
  `, [a.rows[0].application_id]);

  // First call succeeds
  await query(`CALL sp_accept_offer($1, $2);`, [o.rows[0].offer_id, stId]);

  // Second repeated call must fail cleanly
  await assert.rejects(
    async () => {
      await query(`CALL sp_accept_offer($1, $2);`, [o.rows[0].offer_id, stId]);
    },
    /Offer is no longer pending/
  );
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
    WHERE p.embedding IS NOT NULL AND s.profile_embedding IS NOT NULL
    LIMIT 1;
  `);

  assert.ok(res.rows.length > 0);
  assert.ok(parseFloat(res.rows[0].cosine_sim) > 0.0);
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

test('6.4 MongoDB Aggregation: Activity Heatmap by Day of Week and Hour', async () => {
  const heatmap = await getActivityHeatmap();
  assert.ok(Array.isArray(heatmap), 'Heatmap must return an array');
  assert.ok(heatmap.length > 0, 'Heatmap data must contain activity slots');
  assert.ok(heatmap[0].day_of_week >= 1 && heatmap[0].day_of_week <= 7, 'day_of_week must be between 1 and 7');
  assert.ok(heatmap[0].hour_of_day >= 0 && heatmap[0].hour_of_day <= 23, 'hour_of_day must be between 0 and 23');
  assert.ok(heatmap[0].total_events >= 1, 'total_events must be positive');
});

test('6.5 MongoDB Aggregation: Top Review Tags Analysis', async () => {
  const tags = await getTopReviewTags();
  assert.ok(Array.isArray(tags), 'Top review tags must return an array');
  assert.ok(tags.length > 0, 'Review tags must contain aggregated tag counts');
  assert.ok(typeof tags[0].tag === 'string', 'Tag must be a string identifier');
  assert.ok(tags[0].count >= 1, 'Tag count must be >= 1');
  if (tags.length > 1) {
    assert.ok(tags[0].count >= tags[1].count, 'Tags must be sorted descending by frequency');
  }
});

// ============================================================================
// 7. AUTHENTICATION, RBAC & MATERIALIZED VIEW REFRESH TESTS
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

test('7.3 RBAC: requireAuth enforces role-based access control', () => {
  const token = createToken({ userId: 1, role: 'student', email: 'student@pes.edu' });
  const headersMap = new Map([['authorization', `Bearer ${token}`]]);
  const fakeRequest = {
    headers: {
      get: (k) => headersMap.get(k.toLowerCase()) || null,
    },
  };

  // Student role allowed
  const user = requireAuth(fakeRequest, ['student']);
  assert.equal(user.role, 'student');

  // Admin role forbidden for student
  assert.throws(
    () => {
      requireAuth(fakeRequest, ['admin']);
    },
    /Forbidden: Role 'student' does not have permission/
  );
});

test('7.4 Materialized View: sp_refresh_skill_demand_mv procedure executes concurrently without error', async () => {
  const start = Date.now();
  await query('SELECT sp_refresh_skill_demand_mv();');
  const duration = Date.now() - start;
  assert.ok(duration >= 0);

  const mvCheck = await query('SELECT count(*) AS total_skills FROM mv_skill_demand');
  assert.ok(parseInt(mvCheck.rows[0].total_skills) > 0);
});
