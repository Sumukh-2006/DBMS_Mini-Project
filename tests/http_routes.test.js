// tests/http_routes.test.js
// Dedicated HTTP Endpoint Integration & Authorization Test Suite
// Verifies all 6 hardened endpoints against an active Next.js server runtime.

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const { spawn } = require('child_process');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const { pool, query } = require('../lib/db');
const { createToken } = require('../lib/auth');

const TEST_PORT = 3005;
const BASE_URL = `http://localhost:${TEST_PORT}`;
let serverProcess = null;

let counter = 0;
function uniqueId(prefix = 'http') {
  counter++;
  return `${prefix}_${Date.now()}_${counter}_${Math.floor(Math.random() * 10000)}`;
}

// Dynamic Fixture Helpers
async function setupTestTenant(verified = true) {
  const cid = uniqueId('c');
  const comp = await query(
    `INSERT INTO company (name, industry, verified) VALUES ($1, 'Software', $2) RETURNING company_id`,
    [`Company_${cid}`, verified]
  );
  const companyId = comp.rows[0].company_id;

  const uid = uniqueId('rec');
  const u = await query(
    `INSERT INTO app_user (email, password_hash, role) VALUES ($1, 'hash', 'recruiter') RETURNING user_id`,
    [`${uid}@company.com`]
  );
  const userId = u.rows[0].user_id;

  const r = await query(
    `INSERT INTO recruiter (user_id, company_id, designation) VALUES ($1, $2, 'Lead Technical Recruiter') RETURNING recruiter_id`,
    [userId, companyId]
  );
  const recruiterId = r.rows[0].recruiter_id;

  const token = createToken({
    userId,
    email: `${uid}@company.com`,
    role: 'recruiter',
    recruiterId,
    companyId
  });

  return { companyId, userId, recruiterId, token };
}

async function setupTestStudent() {
  const uid = uniqueId('stu');
  const u = await query(
    `INSERT INTO app_user (email, password_hash, role) VALUES ($1, 'hash', 'student') RETURNING user_id`,
    [`${uid}@pes.edu`]
  );
  const userId = u.rows[0].user_id;

  const s = await query(
    `INSERT INTO student (user_id, dept_id, usn, full_name, year, cgpa, grad_year)
     VALUES ($1, 1, $2, 'HTTP Test Student', 3, 9.20, 2026) RETURNING student_id`,
    [userId, `U_${uid}`.slice(0, 30)]
  );
  const studentId = s.rows[0].student_id;

  const token = createToken({
    userId,
    email: `${uid}@pes.edu`,
    role: 'student',
    studentId
  });

  return { userId, studentId, token };
}

async function createPostingAndApp(companyId, recruiterId, studentId, stage = 'Shortlisted') {
  const pid = uniqueId('p');
  const p = await query(
    `INSERT INTO internship_posting (
      company_id, recruiter_id, title, description, location, openings, filled,
      deadline, start_date, duration_weeks, status
    ) VALUES (
      $1, $2, $3, 'Description', 'Bengaluru', 5, 0,
      CURRENT_TIMESTAMP + INTERVAL '10 days', CURRENT_TIMESTAMP + INTERVAL '40 days', 12, 'open'
    ) RETURNING posting_id`,
    [companyId, recruiterId, `Posting_${pid}`]
  );
  const postingId = p.rows[0].posting_id;

  const a = await query(
    `INSERT INTO application (student_id, posting_id, current_stage) VALUES ($1, $2, $3) RETURNING application_id`,
    [studentId, postingId, stage]
  );
  const applicationId = a.rows[0].application_id;

  return { postingId, applicationId };
}

test.before(async () => {
  // 1. Verify DB is accessible
  await query('SELECT 1');

  // 2. Spawn Next.js server on dedicated test port (auto-detect dev vs start)
  const fs = require('fs');
  const hasBuild = fs.existsSync(path.resolve(__dirname, '../.next/BUILD_ID'));
  const cmd = hasBuild ? ['next', 'start', '-p', String(TEST_PORT)] : ['next', 'dev', '-p', String(TEST_PORT)];

  serverProcess = spawn('npx', cmd, {
    cwd: path.resolve(__dirname, '..'),
    stdio: 'ignore'
  });

  // 3. Poll server until active (up to 30s)
  const start = Date.now();
  let isReady = false;
  while (Date.now() - start < 30000) {
    try {
      const res = await fetch(`${BASE_URL}/api/auth/me`);
      if (res.status === 200) {
        isReady = true;
        break;
      }
    } catch {
      await new Promise(r => setTimeout(r, 200));
    }
  }

  assert.ok(isReady, `Next.js test server failed to start on port ${TEST_PORT} within 30s`);
});

test.after(async () => {
  if (serverProcess) {
    serverProcess.kill('SIGTERM');
  }
  await pool.end();
});

// ============================================================================
// 1. BULK-STAGE ENDPOINT TESTS
// ============================================================================

test('HTTP 1.1 Bulk-Stage: Missing or invalid authentication returns 401', async () => {
  const res = await fetch(`${BASE_URL}/api/recruiter/applications/bulk-stage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ applicationIds: [1], newStage: 'Interview' })
  });
  assert.equal(res.status, 401, 'Unauthenticated request must return 401');
});

test('HTTP 1.2 Bulk-Stage: Missing required fields or empty batch returns 400', async () => {
  const tenant = await setupTestTenant();

  // Missing newStage
  const res1 = await fetch(`${BASE_URL}/api/recruiter/applications/bulk-stage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tenant.token}` },
    body: JSON.stringify({ applicationIds: [1] })
  });
  assert.equal(res1.status, 400);

  // Empty applicationIds
  const res2 = await fetch(`${BASE_URL}/api/recruiter/applications/bulk-stage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tenant.token}` },
    body: JSON.stringify({ applicationIds: [], newStage: 'Interview' })
  });
  assert.equal(res2.status, 400);
});

test('HTTP 1.3 Bulk-Stage: Malformed IDs or invalid stage returns 400', async () => {
  const tenant = await setupTestTenant();

  // Malformed ID
  const res1 = await fetch(`${BASE_URL}/api/recruiter/applications/bulk-stage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tenant.token}` },
    body: JSON.stringify({ applicationIds: [-5, 'abc'], newStage: 'Interview' })
  });
  assert.equal(res1.status, 400);

  // Invalid stage name
  const res2 = await fetch(`${BASE_URL}/api/recruiter/applications/bulk-stage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tenant.token}` },
    body: JSON.stringify({ applicationIds: [1], newStage: 'HiredDirectlyWithoutInterview' })
  });
  assert.equal(res2.status, 400);
});

test('HTTP 1.4 Bulk-Stage: Authorized recruiter advancing own company applications succeeds (200)', async () => {
  const tenant = await setupTestTenant();
  const student = await setupTestStudent();
  const { applicationId } = await createPostingAndApp(tenant.companyId, tenant.recruiterId, student.studentId, 'Shortlisted');

  const res = await fetch(`${BASE_URL}/api/recruiter/applications/bulk-stage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tenant.token}` },
    body: JSON.stringify({ applicationIds: [applicationId], newStage: 'Interview', reason: 'Passed initial screening' })
  });

  assert.equal(res.status, 200);
  const data = await res.json();
  assert.ok(data.results.successful.includes(applicationId));

  // Verify database state mutation
  const check = await query('SELECT current_stage FROM application WHERE application_id = $1', [applicationId]);
  assert.equal(check.rows[0].current_stage, 'Interview');
});

test('HTTP 1.5 Bulk-Stage: Recruiter attempting to modify another company applications is strictly blocked (403)', async () => {
  const tenantA = await setupTestTenant();
  const tenantB = await setupTestTenant();
  const student = await setupTestStudent();

  // Application belongs to Tenant B
  const { applicationId: appB } = await createPostingAndApp(tenantB.companyId, tenantB.recruiterId, student.studentId, 'Shortlisted');

  // Tenant A attempts to modify Tenant B's application
  const res = await fetch(`${BASE_URL}/api/recruiter/applications/bulk-stage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tenantA.token}` },
    body: JSON.stringify({ applicationIds: [appB], newStage: 'Interview' })
  });

  assert.equal(res.status, 403, 'Cross-company bulk stage modification must return 403 Forbidden');
  const data = await res.json();
  assert.match(data.error, /Forbidden/);

  // Verify database state was NOT mutated
  const check = await query('SELECT current_stage FROM application WHERE application_id = $1', [appB]);
  assert.equal(check.rows[0].current_stage, 'Shortlisted', 'Unauthorized application must remain in original stage');
});

test('HTTP 1.6 Bulk-Stage: Mixed batch containing valid and unauthorized IDs is rejected with 403 and zero mutations', async () => {
  const tenantA = await setupTestTenant();
  const tenantB = await setupTestTenant();
  const student = await setupTestStudent();

  const { applicationId: appOwn } = await createPostingAndApp(tenantA.companyId, tenantA.recruiterId, student.studentId, 'Shortlisted');
  const { applicationId: appOther } = await createPostingAndApp(tenantB.companyId, tenantB.recruiterId, student.studentId, 'Shortlisted');

  // Tenant A attempts to update both own application and foreign application
  const res = await fetch(`${BASE_URL}/api/recruiter/applications/bulk-stage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tenantA.token}` },
    body: JSON.stringify({ applicationIds: [appOwn, appOther], newStage: 'Interview' })
  });

  assert.equal(res.status, 403, 'Mixed batch must be rejected with 403 Forbidden');

  // Verify NEITHER application was modified
  const checkOwn = await query('SELECT current_stage FROM application WHERE application_id = $1', [appOwn]);
  const checkOther = await query('SELECT current_stage FROM application WHERE application_id = $1', [appOther]);
  assert.equal(checkOwn.rows[0].current_stage, 'Shortlisted', 'Own application must not be partially updated');
  assert.equal(checkOther.rows[0].current_stage, 'Shortlisted', 'Foreign application must not be updated');
});

test('HTTP 1.7 Bulk-Stage: Subsequent valid request succeeds after a rejected request (verifying connection health)', async () => {
  const tenantA = await setupTestTenant();
  const student = await setupTestStudent();
  const { applicationId } = await createPostingAndApp(tenantA.companyId, tenantA.recruiterId, student.studentId, 'Shortlisted');

  // 1. Fire an invalid request that triggers rollback
  await fetch(`${BASE_URL}/api/recruiter/applications/bulk-stage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tenantA.token}` },
    body: JSON.stringify({ applicationIds: [999999], newStage: 'Interview' })
  });

  // 2. Subsequent valid request must work smoothly without connection leaks
  const res = await fetch(`${BASE_URL}/api/recruiter/applications/bulk-stage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tenantA.token}` },
    body: JSON.stringify({ applicationIds: [applicationId], newStage: 'Interview' })
  });

  assert.equal(res.status, 200);
  const data = await res.json();
  assert.ok(data.results.successful.includes(applicationId));
});

// ============================================================================
// 2. OTHER HARDENED ENDPOINT RBAC TESTS
// ============================================================================

test('HTTP 2.1 Applicants: Recruiter viewing another company posting applicants is blocked with 403', async () => {
  const tenantA = await setupTestTenant();
  const tenantB = await setupTestTenant();
  const student = await setupTestStudent();
  const { postingId: postB } = await createPostingAndApp(tenantB.companyId, tenantB.recruiterId, student.studentId);

  // Recruiter A attempts to view Recruiter B's applicants
  const res = await fetch(`${BASE_URL}/api/recruiter/postings/${postB}/applicants`, {
    headers: { Authorization: `Bearer ${tenantA.token}` }
  });

  assert.equal(res.status, 403);
  const data = await res.json();
  assert.match(data.error, /Forbidden/);
});

test('HTTP 2.2 Applicants: Recruiter viewing own company applicants succeeds with 200', async () => {
  const tenant = await setupTestTenant();
  const student = await setupTestStudent();
  const { postingId } = await createPostingAndApp(tenant.companyId, tenant.recruiterId, student.studentId);

  const res = await fetch(`${BASE_URL}/api/recruiter/postings/${postingId}/applicants`, {
    headers: { Authorization: `Bearer ${tenant.token}` }
  });

  assert.equal(res.status, 200);
  const data = await res.json();
  assert.ok(Array.isArray(data.applicants));
});

test('HTTP 2.3 Offers: Recruiter issuing offer to another company applicant is blocked with 403', async () => {
  const tenantA = await setupTestTenant();
  const tenantB = await setupTestTenant();
  const student = await setupTestStudent();
  const { applicationId: appB } = await createPostingAndApp(tenantB.companyId, tenantB.recruiterId, student.studentId, 'Shortlisted');

  // Recruiter A attempts to issue offer to Candidate B
  const res = await fetch(`${BASE_URL}/api/recruiter/offers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tenantA.token}` },
    body: JSON.stringify({
      applicationId: appB,
      stipend: 90000,
      startDate: new Date(Date.now() + 86400000 * 30).toISOString(),
      expiryDays: 7
    })
  });

  assert.equal(res.status, 403);
  const data = await res.json();
  assert.match(data.error, /Forbidden/);
});

test('HTTP 2.4 Interviews: Recruiter scheduling interview for another company candidate is blocked with 403', async () => {
  const tenantA = await setupTestTenant();
  const tenantB = await setupTestTenant();
  const student = await setupTestStudent();
  const { applicationId: appB } = await createPostingAndApp(tenantB.companyId, tenantB.recruiterId, student.studentId, 'Shortlisted');

  // Recruiter A attempts to schedule interview for Candidate B
  const res = await fetch(`${BASE_URL}/api/recruiter/interviews`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tenantA.token}` },
    body: JSON.stringify({
      applicationId: appB,
      roundNo: 1,
      scheduledAt: new Date(Date.now() + 86400000 * 5).toISOString(),
      durationMin: 45,
      mode: 'online'
    })
  });

  assert.equal(res.status, 403);
  const data = await res.json();
  assert.match(data.error, /Forbidden/);
});

test('HTTP 2.5 Student Offers: Student attempting to decline another student offer is blocked with 403', async () => {
  const tenant = await setupTestTenant();
  const student1 = await setupTestStudent();
  const student2 = await setupTestStudent();

  const { applicationId } = await createPostingAndApp(tenant.companyId, tenant.recruiterId, student2.studentId, 'Offered');
  const o = await query(
    `INSERT INTO offer (application_id, stipend, start_date, expires_at, status)
     VALUES ($1, 95000, CURRENT_TIMESTAMP + INTERVAL '30 days', CURRENT_TIMESTAMP + INTERVAL '7 days', 'pending')
     RETURNING offer_id`,
    [applicationId]
  );
  const foreignOfferId = o.rows[0].offer_id;

  // Student 1 attempts to decline Student 2's offer
  const res = await fetch(`${BASE_URL}/api/student/offers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${student1.token}` },
    body: JSON.stringify({ offerId: foreignOfferId, action: 'decline' })
  });

  assert.equal(res.status, 403);
  const data = await res.json();
  assert.match(data.error, /Forbidden/);
});

test('HTTP 2.6 Postings: Recruiter belonging to an unverified company is blocked from creating postings (403)', async () => {
  const unverifiedTenant = await setupTestTenant(false); // verified = false

  const res = await fetch(`${BASE_URL}/api/recruiter/postings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${unverifiedTenant.token}` },
    body: JSON.stringify({
      title: 'Unverified Company Job',
      description: 'Role description',
      location: 'Bengaluru',
      mode: 'remote',
      openings: 2,
      minCgpa: 7.5,
      deadline: new Date(Date.now() + 86400000 * 10).toISOString(),
      startDate: new Date(Date.now() + 86400000 * 30).toISOString(),
      durationWeeks: 12
    })
  });

  assert.equal(res.status, 403);
  const data = await res.json();
  assert.match(data.error, /Forbidden.*unverified/i);
});
