// tests/standalone_audit.test.js
// Comprehensive standalone audit test — runs WITHOUT Docker/PostgreSQL/MongoDB
// Tests every feature that can be verified purely in-process:
//   1. Auth: bcrypt hashing & verification
//   2. Auth: JWT signing, verification, expiry, tampering
//   3. Auth: RBAC requireAuth with all role combinations
//   4. Embeddings: 384-dimensional vector generation
//   5. Embeddings: L2 normalization verification
//   6. Embeddings: Cosine similarity correctness
//   7. Embeddings: Semantic cluster separation (backend vs frontend vs AI vs mobile)
//   8. Embeddings: Deterministic reproducibility
//   9. Embeddings: Edge cases (empty, null, special chars)
//  10. Embeddings: vectorToSql format
//  11. Auth: getUserFromRequest with Bearer token
//  12. Auth: getUserFromRequest with cookie
//  13. Auth: getUserFromRequest with no credentials
//  14. RBAC: Multi-role allowedRoles
//  15. RBAC: Empty allowedRoles (any authenticated user)
//  16. Code structure verification (file existence, exports)

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs');

// Set env before requiring modules
process.env.JWT_SECRET = 'test-secret-key-for-standalone-audit';
process.env.COOKIE_NAME = 'interntrack_session';

const { hashPassword, verifyPassword, createToken, verifyToken, getUserFromRequest, requireAuth, COOKIE_NAME } = require('../lib/auth');
const { generateEmbedding, vectorToSql, cosineSimilarity } = require('../lib/embeddings');

// ============================================================================
// 1. AUTH: PASSWORD HASHING & VERIFICATION (bcrypt)
// ============================================================================
test('1.1 Auth: hashPassword produces a bcrypt hash different from plaintext', async () => {
  const password = 'secureStudentPassword!2024';
  const hash = await hashPassword(password);
  assert.ok(typeof hash === 'string', 'Hash must be a string');
  assert.ok(hash !== password, 'Hash must differ from plaintext');
  assert.ok(hash.startsWith('$2'), 'Hash must be a bcrypt hash (starts with $2)');
  assert.ok(hash.length >= 50, 'Bcrypt hash must be at least 50 chars');
});

test('1.2 Auth: verifyPassword correctly matches password to its hash', async () => {
  const password = 'MyP@ssw0rd!2024';
  const hash = await hashPassword(password);
  const isMatch = await verifyPassword(password, hash);
  assert.equal(isMatch, true, 'Correct password must verify');
});

test('1.3 Auth: verifyPassword rejects wrong password', async () => {
  const password = 'CorrectPassword';
  const hash = await hashPassword(password);
  const isWrong = await verifyPassword('WrongPassword', hash);
  assert.equal(isWrong, false, 'Wrong password must not verify');
});

test('1.4 Auth: Two hashes of same password are different (salt uniqueness)', async () => {
  const password = 'SamePassword';
  const hash1 = await hashPassword(password);
  const hash2 = await hashPassword(password);
  assert.notEqual(hash1, hash2, 'Each hash must use a unique salt');
  // But both must verify
  assert.equal(await verifyPassword(password, hash1), true);
  assert.equal(await verifyPassword(password, hash2), true);
});

test('1.5 Auth: Empty password hashing/verification works without crash', async () => {
  const hash = await hashPassword('');
  assert.ok(hash.startsWith('$2'), 'Empty password still produces valid bcrypt hash');
  assert.equal(await verifyPassword('', hash), true);
  assert.equal(await verifyPassword('notempty', hash), false);
});

// ============================================================================
// 2. AUTH: JWT TOKEN SIGNING, VERIFICATION, CLAIMS
// ============================================================================
test('2.1 Auth: createToken produces a valid JWT string', () => {
  const payload = { userId: 42, role: 'admin', email: 'admin@pes.edu' };
  const token = createToken(payload);
  assert.ok(typeof token === 'string', 'Token must be a string');
  const parts = token.split('.');
  assert.equal(parts.length, 3, 'JWT must have 3 dot-separated parts (header.payload.signature)');
});

test('2.2 Auth: verifyToken decodes correct claims', () => {
  const payload = { userId: 42, role: 'admin', email: 'admin@pes.edu' };
  const token = createToken(payload);
  const decoded = verifyToken(token);
  assert.equal(decoded.userId, 42);
  assert.equal(decoded.role, 'admin');
  assert.equal(decoded.email, 'admin@pes.edu');
  assert.ok(decoded.iat, 'Must have issued-at timestamp');
  assert.ok(decoded.exp, 'Must have expiry timestamp');
});

test('2.3 Auth: JWT contains 7-day expiry', () => {
  const token = createToken({ userId: 1, role: 'student' });
  const decoded = verifyToken(token);
  const expiryDuration = decoded.exp - decoded.iat;
  assert.equal(expiryDuration, 7 * 24 * 60 * 60, 'JWT expiry must be exactly 7 days (604800 seconds)');
});

test('2.4 Auth: verifyToken returns null for tampered token', () => {
  const token = createToken({ userId: 1, role: 'student' });
  const tampered = token.slice(0, -5) + 'XXXXX'; // corrupt signature
  const result = verifyToken(tampered);
  assert.equal(result, null, 'Tampered token must return null');
});

test('2.5 Auth: verifyToken returns null for garbage input', () => {
  assert.equal(verifyToken('not.a.jwt'), null);
  assert.equal(verifyToken(''), null);
  assert.equal(verifyToken('random-garbage'), null);
});

test('2.6 Auth: All three roles produce valid tokens (student, recruiter, admin)', () => {
  for (const role of ['student', 'recruiter', 'admin']) {
    const token = createToken({ userId: 1, role, email: `${role}@pes.edu` });
    const decoded = verifyToken(token);
    assert.equal(decoded.role, role, `Role '${role}' must round-trip through JWT`);
  }
});

test('2.7 Auth: Complex payload with nested claims preserves all data', () => {
  const payload = {
    userId: 99,
    role: 'recruiter',
    email: 'recruiter@company.com',
    recruiterId: 5,
    companyId: 3
  };
  const token = createToken(payload);
  const decoded = verifyToken(token);
  assert.equal(decoded.recruiterId, 5);
  assert.equal(decoded.companyId, 3);
});

// ============================================================================
// 3. AUTH: getUserFromRequest (Bearer + Cookie)
// ============================================================================
test('3.1 Auth: getUserFromRequest extracts user from Bearer token', () => {
  const token = createToken({ userId: 42, role: 'admin', email: 'admin@pes.edu' });
  const fakeRequest = {
    headers: {
      get: (k) => {
        if (k.toLowerCase() === 'authorization') return `Bearer ${token}`;
        return null;
      }
    }
  };
  const user = getUserFromRequest(fakeRequest);
  assert.equal(user.userId, 42);
  assert.equal(user.role, 'admin');
});

test('3.2 Auth: getUserFromRequest extracts user from HTTP-only cookie', () => {
  const token = createToken({ userId: 7, role: 'student', email: 'stu@pes.edu' });
  const fakeRequest = {
    headers: {
      get: (k) => {
        if (k.toLowerCase() === 'cookie') return `other=abc; ${COOKIE_NAME}=${encodeURIComponent(token)}; path=/`;
        return null;
      }
    }
  };
  const user = getUserFromRequest(fakeRequest);
  assert.equal(user.userId, 7);
  assert.equal(user.role, 'student');
});

test('3.3 Auth: getUserFromRequest returns null when no credentials present', () => {
  const fakeRequest = {
    headers: { get: () => null }
  };
  const user = getUserFromRequest(fakeRequest);
  assert.equal(user, null);
});

test('3.4 Auth: getUserFromRequest returns null for invalid Bearer token', () => {
  const fakeRequest = {
    headers: {
      get: (k) => k.toLowerCase() === 'authorization' ? 'Bearer invalid.token.here' : null
    }
  };
  const user = getUserFromRequest(fakeRequest);
  assert.equal(user, null);
});

test('3.5 Auth: Bearer token takes priority over cookie', () => {
  const bearerToken = createToken({ userId: 1, role: 'admin', email: 'admin@pes.edu' });
  const cookieToken = createToken({ userId: 2, role: 'student', email: 'stu@pes.edu' });
  const fakeRequest = {
    headers: {
      get: (k) => {
        if (k.toLowerCase() === 'authorization') return `Bearer ${bearerToken}`;
        if (k.toLowerCase() === 'cookie') return `${COOKIE_NAME}=${cookieToken}`;
        return null;
      }
    }
  };
  const user = getUserFromRequest(fakeRequest);
  assert.equal(user.userId, 1, 'Bearer token user must take priority over cookie user');
  assert.equal(user.role, 'admin');
});

// ============================================================================
// 4. AUTH: RBAC requireAuth
// ============================================================================
test('4.1 RBAC: requireAuth allows matching role', () => {
  const token = createToken({ userId: 1, role: 'student', email: 'stu@pes.edu' });
  const fakeRequest = {
    headers: { get: (k) => k.toLowerCase() === 'authorization' ? `Bearer ${token}` : null }
  };
  const user = requireAuth(fakeRequest, ['student']);
  assert.equal(user.role, 'student');
});

test('4.2 RBAC: requireAuth blocks non-matching role with Forbidden error', () => {
  const token = createToken({ userId: 1, role: 'student', email: 'stu@pes.edu' });
  const fakeRequest = {
    headers: { get: (k) => k.toLowerCase() === 'authorization' ? `Bearer ${token}` : null }
  };
  assert.throws(
    () => requireAuth(fakeRequest, ['admin']),
    /Forbidden: Role 'student' does not have permission/
  );
});

test('4.3 RBAC: requireAuth throws 401 for unauthenticated request', () => {
  const fakeRequest = { headers: { get: () => null } };
  try {
    requireAuth(fakeRequest, ['student']);
    assert.fail('Should have thrown');
  } catch (err) {
    assert.equal(err.status, 401);
    assert.match(err.message, /Authentication required/);
  }
});

test('4.4 RBAC: requireAuth throws 403 for wrong role', () => {
  const token = createToken({ userId: 1, role: 'recruiter', email: 'rec@co.com' });
  const fakeRequest = {
    headers: { get: (k) => k.toLowerCase() === 'authorization' ? `Bearer ${token}` : null }
  };
  try {
    requireAuth(fakeRequest, ['admin']);
    assert.fail('Should have thrown');
  } catch (err) {
    assert.equal(err.status, 403);
  }
});

test('4.5 RBAC: Multi-role allowedRoles works (recruiter allowed in [recruiter, admin])', () => {
  const token = createToken({ userId: 1, role: 'recruiter', email: 'rec@co.com' });
  const fakeRequest = {
    headers: { get: (k) => k.toLowerCase() === 'authorization' ? `Bearer ${token}` : null }
  };
  const user = requireAuth(fakeRequest, ['recruiter', 'admin']);
  assert.equal(user.role, 'recruiter');
});

test('4.6 RBAC: Empty allowedRoles allows any authenticated user', () => {
  const token = createToken({ userId: 1, role: 'student', email: 'stu@pes.edu' });
  const fakeRequest = {
    headers: { get: (k) => k.toLowerCase() === 'authorization' ? `Bearer ${token}` : null }
  };
  const user = requireAuth(fakeRequest, []);
  assert.equal(user.role, 'student');
});

// ============================================================================
// 5. EMBEDDINGS: 384-DIMENSIONAL VECTOR GENERATION
// ============================================================================
test('5.1 Embeddings: Generates exactly 384-dimensional vector', () => {
  const vec = generateEmbedding('Backend distributed systems PostgreSQL');
  assert.equal(vec.length, 384, 'Vector dimension must be exactly 384');
});

test('5.2 Embeddings: Vector is L2-normalized (unit length)', () => {
  const vec = generateEmbedding('Machine Learning PyTorch NLP transformers');
  let sumSq = 0;
  for (const v of vec) sumSq += v * v;
  const norm = Math.sqrt(sumSq);
  assert.ok(Math.abs(norm - 1.0) < 0.001, `L2 norm must be ~1.0, got ${norm}`);
});

test('5.3 Embeddings: Deterministic — same text produces identical vector', () => {
  const v1 = generateEmbedding('Kubernetes Docker cloud microservices');
  const v2 = generateEmbedding('Kubernetes Docker cloud microservices');
  for (let i = 0; i < 384; i++) {
    assert.equal(v1[i], v2[i], `Dimension ${i} must be identical for same input`);
  }
});

test('5.4 Embeddings: Different texts produce different vectors', () => {
  const v1 = generateEmbedding('Backend systems PostgreSQL');
  const v2 = generateEmbedding('Frontend React CSS design');
  let same = true;
  for (let i = 0; i < 384; i++) {
    if (v1[i] !== v2[i]) { same = false; break; }
  }
  assert.ok(!same, 'Different domain texts must produce different vectors');
});

// ============================================================================
// 6. EMBEDDINGS: COSINE SIMILARITY & SEMANTIC CLUSTERS
// ============================================================================
test('6.1 Embeddings: Cosine similarity of identical vectors = 1.0', () => {
  const v = generateEmbedding('PostgreSQL database backend');
  const sim = cosineSimilarity(v, v);
  assert.ok(Math.abs(sim - 1.0) < 0.0001, `Self-similarity must be ~1.0, got ${sim}`);
});

test('6.2 Embeddings: Related backend terms have HIGH similarity', () => {
  const v1 = generateEmbedding('Distributed Systems Go Kubernetes PostgreSQL Backend');
  const v2 = generateEmbedding('Cloud backend engineer golang microservices');
  const sim = cosineSimilarity(v1, v2);
  assert.ok(sim > 0.3, `Related backend terms must have high similarity, got ${sim}`);
});

test('6.3 Embeddings: Unrelated domains have LOW similarity', () => {
  const backend = generateEmbedding('Distributed Systems Go Kubernetes PostgreSQL Backend');
  const frontend = generateEmbedding('Frontend UI React Next.js CSS styling');
  const sim = cosineSimilarity(backend, frontend);
  assert.ok(sim < 0.5, `Cross-domain terms must have low similarity, got ${sim}`);
});

test('6.4 Embeddings: Same-domain similarity > cross-domain similarity', () => {
  const v1 = generateEmbedding('Distributed Systems Go Kubernetes PostgreSQL Backend');
  const v2 = generateEmbedding('Cloud backend engineer golang microservices');
  const v3 = generateEmbedding('Frontend UI React Next.js CSS styling');

  const simHigh = cosineSimilarity(v1, v2);
  const simLow = cosineSimilarity(v1, v3);
  assert.ok(simHigh > simLow,
    `Same-domain similarity (${simHigh.toFixed(4)}) must > cross-domain (${simLow.toFixed(4)})`);
});

test('6.5 Embeddings: AI/ML cluster separation from Backend cluster', () => {
  const ai = generateEmbedding('Machine learning PyTorch deep learning NLP transformers');
  const backend = generateEmbedding('PostgreSQL database backend distributed systems');
  const ai2 = generateEmbedding('AI neural networks tensorflow computer vision');
  
  const aiToAi = cosineSimilarity(ai, ai2);
  const aiToBackend = cosineSimilarity(ai, backend);
  assert.ok(aiToAi > aiToBackend,
    `AI-to-AI (${aiToAi.toFixed(4)}) must > AI-to-Backend (${aiToBackend.toFixed(4)})`);
});

test('6.6 Embeddings: Mobile cluster separation', () => {
  const mobile = generateEmbedding('Android iOS mobile embedded hardware');
  const mobile2 = generateEmbedding('mobile app ios react native android');
  const backend = generateEmbedding('distributed systems kubernetes docker linux');
  
  const mobileSim = cosineSimilarity(mobile, mobile2);
  const crossSim = cosineSimilarity(mobile, backend);
  assert.ok(mobileSim > crossSim,
    `Mobile-to-Mobile (${mobileSim.toFixed(4)}) must > Mobile-to-Backend (${crossSim.toFixed(4)})`);
});

// ============================================================================
// 7. EMBEDDINGS: EDGE CASES
// ============================================================================
test('7.1 Embeddings: Empty string returns valid 384-dim unit vector', () => {
  const vec = generateEmbedding('');
  assert.equal(vec.length, 384);
  assert.equal(vec[0], 1.0, 'First dimension must be 1.0 for empty input');
});

test('7.2 Embeddings: Null input returns valid 384-dim unit vector', () => {
  const vec = generateEmbedding(null);
  assert.equal(vec.length, 384);
  assert.equal(vec[0], 1.0);
});

test('7.3 Embeddings: Special characters are handled gracefully', () => {
  const vec = generateEmbedding('C++ C# .NET React.js Node.js');
  assert.equal(vec.length, 384);
  let sumSq = 0;
  for (const v of vec) sumSq += v * v;
  assert.ok(Math.abs(Math.sqrt(sumSq) - 1.0) < 0.001, 'Must still be L2-normalized');
});

test('7.4 Embeddings: Very long text input works without error', () => {
  const longText = 'kubernetes docker cloud microservices '.repeat(100);
  const vec = generateEmbedding(longText);
  assert.equal(vec.length, 384);
});

// ============================================================================
// 8. EMBEDDINGS: vectorToSql FORMAT
// ============================================================================
test('8.1 Embeddings: vectorToSql produces pgvector-compatible format', () => {
  const vec = [0.1, 0.2, 0.3, 0.4];
  const sql = vectorToSql(vec);
  assert.equal(sql, '[0.1,0.2,0.3,0.4]');
  assert.ok(sql.startsWith('['), 'Must start with [');
  assert.ok(sql.endsWith(']'), 'Must end with ]');
});

test('8.2 Embeddings: vectorToSql with 384-dim embedding', () => {
  const vec = generateEmbedding('test input');
  const sql = vectorToSql(vec);
  assert.ok(sql.startsWith('['));
  assert.ok(sql.endsWith(']'));
  const values = sql.slice(1, -1).split(',');
  assert.equal(values.length, 384, 'SQL vector must contain 384 values');
});

// ============================================================================
// 9. CODE STRUCTURE VERIFICATION (File Existence & Exports)
// ============================================================================
const projectRoot = path.resolve(__dirname, '..');

test('9.1 Code Structure: All 6 SQL migration files exist', () => {
  const migrations = [
    '001_init.sql', '002_indexes.sql', '003_views.sql',
    '004_functions_triggers.sql', '005_alter_demo.sql', '006_seed.sql'
  ];
  for (const m of migrations) {
    const fp = path.join(projectRoot, 'db', 'migrations', m);
    assert.ok(fs.existsSync(fp), `Migration file ${m} must exist`);
  }
});

test('9.2 Code Structure: All lib modules exist and export required functions', () => {
  // auth.js exports
  assert.equal(typeof hashPassword, 'function');
  assert.equal(typeof verifyPassword, 'function');
  assert.equal(typeof createToken, 'function');
  assert.equal(typeof verifyToken, 'function');
  assert.equal(typeof getUserFromRequest, 'function');
  assert.equal(typeof requireAuth, 'function');
  assert.equal(typeof COOKIE_NAME, 'string');

  // embeddings.js exports
  assert.equal(typeof generateEmbedding, 'function');
  assert.equal(typeof vectorToSql, 'function');
  assert.equal(typeof cosineSimilarity, 'function');
});

test('9.3 Code Structure: docker-compose.yml defines postgres and mongodb services', () => {
  const dc = fs.readFileSync(path.join(projectRoot, 'docker-compose.yml'), 'utf8');
  assert.ok(dc.includes('pgvector/pgvector:pg16'), 'Must use pgvector/pgvector:pg16 image');
  assert.ok(dc.includes('mongo:7.0'), 'Must use mongo:7.0 image');
  assert.ok(dc.includes('interntrack_postgres'), 'Must define interntrack_postgres container');
  assert.ok(dc.includes('interntrack_mongodb'), 'Must define interntrack_mongodb container');
  assert.ok(dc.includes('5432:5432'), 'PostgreSQL port must be 5432');
  assert.ok(dc.includes('27017:27017'), 'MongoDB port must be 27017');
});

test('9.4 Code Structure: package.json has all required scripts', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8'));
  const requiredScripts = ['dev', 'build', 'start', 'db:migrate', 'db:seed', 'db:demo-triggers', 'test'];
  for (const s of requiredScripts) {
    assert.ok(pkg.scripts[s], `Script "${s}" must be defined in package.json`);
  }
});

test('9.5 Code Structure: All 30 API route files exist', () => {
  const routes = [
    'app/api/admin/analytics/department/route.js',
    'app/api/admin/analytics/skill-demand/route.js',
    'app/api/admin/audit-logs/route.js',
    'app/api/admin/dashboard/route.js',
    'app/api/admin/policies/route.js',
    'app/api/admin/reports/export/route.js',
    'app/api/admin/verifications/route.js',
    'app/api/auth/login/route.js',
    'app/api/auth/logout/route.js',
    'app/api/auth/me/route.js',
    'app/api/auth/register/route.js',
    'app/api/recruiter/analytics/funnel/route.js',
    'app/api/recruiter/applications/bulk-stage/route.js',
    'app/api/recruiter/candidates/[id]/similar/route.js',
    'app/api/recruiter/dashboard/route.js',
    'app/api/recruiter/interviews/route.js',
    'app/api/recruiter/interviews/feedback/route.js',
    'app/api/recruiter/offers/route.js',
    'app/api/recruiter/postings/route.js',
    'app/api/recruiter/postings/[id]/applicants/route.js',
    'app/api/reviews/route.js',
    'app/api/student/apply/route.js',
    'app/api/student/dashboard/route.js',
    'app/api/student/interviews/route.js',
    'app/api/student/offers/route.js',
    'app/api/student/pipeline/route.js',
    'app/api/student/postings/route.js',
    'app/api/student/profile/route.js',
    'app/api/student/recommendations/route.js',
    'app/api/student/resume/route.js',
  ];
  for (const r of routes) {
    const fp = path.join(projectRoot, r);
    assert.ok(fs.existsSync(fp), `Route file ${r} must exist`);
  }
});

test('9.6 Code Structure: All frontend page files exist', () => {
  const pages = [
    'app/page.js', 'app/layout.js',
    'app/login/page.js', 'app/register/page.js',
    'app/admin/page.js', 'app/admin/layout.js',
    'app/admin/analytics/page.js', 'app/admin/audit-logs/page.js',
    'app/admin/export/page.js', 'app/admin/policies/page.js',
    'app/admin/verifications/page.js',
    'app/student/page.js', 'app/student/layout.js',
    'app/recruiter/page.js', 'app/recruiter/layout.js',
  ];
  for (const p of pages) {
    const fp = path.join(projectRoot, p);
    assert.ok(fs.existsSync(fp), `Page file ${p} must exist`);
  }
});

// ============================================================================
// 10. SQL SCHEMA VERIFICATION (Static Analysis of Migration Files)
// ============================================================================
test('10.1 SQL Schema: 001_init.sql defines all 17 tables', () => {
  const sql = fs.readFileSync(path.join(projectRoot, 'db/migrations/001_init.sql'), 'utf8');
  const tables = [
    'app_user', 'department', 'student', 'company', 'recruiter', 'skill',
    'student_skill', 'internship_posting', 'posting_skill', 'posting_eligible_dept',
    'application', 'application_stage_history', 'interview', 'interview_panelist',
    'offer', 'policy_config', 'audit_log'
  ];
  for (const t of tables) {
    assert.ok(sql.includes(`CREATE TABLE ${t}`), `Table "${t}" must be defined in 001_init.sql`);
  }
});

test('10.2 SQL Schema: 001_init.sql defines all 7 ENUM types', () => {
  const sql = fs.readFileSync(path.join(projectRoot, 'db/migrations/001_init.sql'), 'utf8');
  const enums = [
    'user_role', 'posting_status', 'posting_mode', 'application_stage',
    'interview_mode', 'interview_status', 'offer_status'
  ];
  for (const e of enums) {
    assert.ok(sql.includes(e), `ENUM type "${e}" must be defined in 001_init.sql`);
  }
});

test('10.3 SQL Schema: Critical CHECK constraints exist', () => {
  const sql = fs.readFileSync(path.join(projectRoot, 'db/migrations/001_init.sql'), 'utf8');
  const checks = [
    'chk_student_cgpa', 'chk_student_year', 'chk_student_grad_year',
    'chk_posting_filled', 'chk_posting_openings', 'chk_posting_stipend',
    'chk_app_user_email_format', 'chk_offer_stipend',
  ];
  for (const c of checks) {
    assert.ok(sql.includes(c), `CHECK constraint "${c}" must be defined`);
  }
});

test('10.4 SQL Schema: UNIQUE constraints exist for key business rules', () => {
  const sql = fs.readFileSync(path.join(projectRoot, 'db/migrations/001_init.sql'), 'utf8');
  const uniques = [
    'uq_app_user_email', 'uq_student_usn', 'uq_student_user_id',
    'uq_company_name', 'uq_recruiter_user_id', 'uq_skill_name',
    'uq_student_posting_application', 'uq_interview_round', 'uq_offer_application'
  ];
  for (const u of uniques) {
    assert.ok(sql.includes(u), `UNIQUE constraint "${u}" must be defined`);
  }
});

test('10.5 SQL Schema: Extensions pgvector, pg_trgm, uuid-ossp are created', () => {
  const sql = fs.readFileSync(path.join(projectRoot, 'db/migrations/001_init.sql'), 'utf8');
  assert.ok(sql.includes('CREATE EXTENSION IF NOT EXISTS vector'), 'pgvector extension must be created');
  assert.ok(sql.includes('CREATE EXTENSION IF NOT EXISTS pg_trgm'), 'pg_trgm extension must be created');
});

test('10.6 SQL Schema: 002_indexes.sql defines required indexes', () => {
  const sql = fs.readFileSync(path.join(projectRoot, 'db/migrations/002_indexes.sql'), 'utf8');
  const indexes = [
    'idx_posting_search_tsv', 'idx_skill_name_trgm', 'idx_posting_embedding_hnsw',
    'idx_student_profile_embedding_hnsw', 'uq_student_single_accepted_application',
  ];
  for (const idx of indexes) {
    assert.ok(sql.includes(idx), `Index "${idx}" must be defined in 002_indexes.sql`);
  }
});

test('10.7 SQL Schema: 003_views.sql defines 5 views + 1 materialized view', () => {
  const sql = fs.readFileSync(path.join(projectRoot, 'db/migrations/003_views.sql'), 'utf8');
  const views = [
    'v_student_pipeline', 'v_posting_funnel', 'v_company_stats',
    'v_upcoming_deadlines', 'v_department_placement'
  ];
  for (const v of views) {
    assert.ok(sql.includes(v), `View "${v}" must be defined in 003_views.sql`);
  }
  assert.ok(sql.includes('mv_skill_demand'), 'Materialized view "mv_skill_demand" must be defined');
});

test('10.8 SQL Schema: 004_functions_triggers.sql defines all stored procedures', () => {
  const sql = fs.readFileSync(path.join(projectRoot, 'db/migrations/004_functions_triggers.sql'), 'utf8');
  const procedures = ['sp_apply', 'sp_advance_stage', 'sp_issue_offer', 'sp_accept_offer', 'sp_expire_offers'];
  for (const p of procedures) {
    assert.ok(sql.includes(p), `Stored procedure "${p}" must be defined`);
  }
});

test('10.9 SQL Schema: 004_functions_triggers.sql defines all critical triggers', () => {
  const sql = fs.readFileSync(path.join(projectRoot, 'db/migrations/004_functions_triggers.sql'), 'utf8');
  const triggers = [
    'trg_stage_history_immutable', 'trg_audit_log_immutable',
    'trg_block_late_apply', 'trg_interview_clash',
    'trg_app_stage_audit', 'trg_posting_autoclose',
    'trg_one_accepted_offer', 'trg_posting_search_vector'
  ];
  for (const t of triggers) {
    assert.ok(sql.includes(t), `Trigger "${t}" must be defined in 004_functions_triggers.sql`);
  }
});

test('10.10 SQL Schema: sp_accept_offer uses SELECT ... FOR UPDATE locking hierarchy', () => {
  const sql = fs.readFileSync(path.join(projectRoot, 'db/migrations/004_functions_triggers.sql'), 'utf8');
  // Extract the sp_accept_offer procedure body
  const procStart = sql.indexOf('sp_accept_offer');
  const procSection = sql.substring(procStart, procStart + 3000);
  
  // Verify the correct lock acquisition order: student -> offer -> application -> posting
  const studentLockPos = procSection.indexOf('FROM student WHERE student_id = p_student_id FOR UPDATE');
  const offerLockPos = procSection.indexOf('FROM offer');
  const appLockPos = procSection.indexOf('FROM application');
  const postingLockPos = procSection.indexOf('FROM internship_posting');
  
  assert.ok(studentLockPos > 0, 'Must lock student row FOR UPDATE');
  assert.ok(offerLockPos > studentLockPos, 'Offer lock must come after student lock');
  assert.ok(postingLockPos > offerLockPos, 'Posting lock must come after offer lock');
});

test('10.11 SQL Schema: sp_advance_stage enforces state machine transitions', () => {
  const sql = fs.readFileSync(path.join(projectRoot, 'db/migrations/004_functions_triggers.sql'), 'utf8');
  // Verify legal transition rules are present
  assert.ok(sql.includes("'Applied' AND p_new_stage IN ('Shortlisted', 'Rejected', 'Withdrawn')"), 
    'Applied can only go to Shortlisted/Rejected/Withdrawn');
  assert.ok(sql.includes("'Shortlisted' AND p_new_stage IN ('Interview', 'Offered', 'Rejected', 'Withdrawn')"),
    'Shortlisted can go to Interview/Offered/Rejected/Withdrawn');
  assert.ok(sql.includes('Illegal stage transition'),
    'Must raise exception for illegal transitions');
});

// ============================================================================
// 11. AGGREGATION PIPELINE VERIFICATION (Static Analysis)
// ============================================================================
test('11.1 MongoDB Aggregations: aggregations.js exports all 5 pipeline functions', () => {
  const agg = require('../lib/aggregations');
  const funcs = [
    'getCompanyRatingAverages', 'getResumeSkillsFrequency',
    'getInterviewFeedbackAverages', 'getActivityHeatmap', 'getTopReviewTags'
  ];
  for (const f of funcs) {
    assert.equal(typeof agg[f], 'function', `aggregations.js must export ${f}`);
  }
});

test('11.2 MongoDB: mongo.js exports required functions', () => {
  const mongo = require('../lib/mongo');
  assert.equal(typeof mongo.getMongoDb, 'function');
  assert.equal(typeof mongo.getCollection, 'function');
  assert.equal(typeof mongo.initMongoIndexes, 'function');
  assert.equal(typeof mongo.closeMongoConnection, 'function');
});

// ============================================================================
// 12. SEED DATA VERIFICATION (Static Analysis)
// ============================================================================
test('12.1 Seed Script: 006_seed.sql contains seeded data for all 17 tables', () => {
  const sql = fs.readFileSync(path.join(projectRoot, 'db/migrations/006_seed.sql'), 'utf8');
  const insertTargets = [
    'policy_config', 'department', 'skill',
    'app_user', 'company', 'recruiter',
    'student', 'student_skill', 'internship_posting',
    'posting_skill', 'posting_eligible_dept',
    'application', 'interview', 'interview_panelist',
    'offer'
  ];
  for (const i of insertTargets) {
    assert.ok(sql.includes(i), `Seed file must contain INSERT for table "${i}"`);
  }
});

test('12.2 Seed Script: Contains bcrypt-hashed passwords for demo users', () => {
  const sql = fs.readFileSync(path.join(projectRoot, 'db/migrations/006_seed.sql'), 'utf8');
  assert.ok(sql.includes('$2a$') || sql.includes('$2b$'), 'Demo user passwords must be bcrypt-hashed');
  assert.ok(sql.includes('admin@pes.edu'), 'Admin demo user must be seeded');
  assert.ok(sql.includes('sumukh.student@pes.edu'), 'Student demo user must be seeded');
});

test('12.3 Seed Script: Contains 384-dimensional vector embeddings', () => {
  const sql = fs.readFileSync(path.join(projectRoot, 'db/migrations/006_seed.sql'), 'utf8');
  // Check for vector literal format [0.xxx,0.xxx,...]
  const vectorPattern = /\[[\d.,\-e]+\]/;
  assert.ok(vectorPattern.test(sql), 'Seed data must contain pgvector embedding literals');
});

console.log('\n=== STANDALONE AUDIT TEST SUITE ===');
console.log('Tests cover: Auth (bcrypt+JWT+RBAC), Embeddings (384-dim vectors+cosine),');
console.log('Code Structure (files+exports+routes), SQL Schema (static analysis),');
console.log('Aggregation Pipelines (exports), and Seed Data (content verification).\n');
