#!/usr/bin/env node
// scripts/master_test.js
// Master Comprehensive System Test Runner
// Executes all 96+ automated assertions across both test suites:
//   - tests/interntrack.test.js  (27 test blocks: Schema, Triggers, SPs, Concurrency, pgvector, MongoDB, Auth)
//   - tests/http_routes.test.js  (14 test blocks: HTTP 401/400/403/200, cross-tenant RBAC, bulk-stage)
//   - tests/standalone_audit.test.js (61 test blocks: offline verification of auth, embeddings, code structure)
//
// Usage:
//   node scripts/master_test.js          # Run all tests (requires Docker containers running)
//   node scripts/master_test.js --quick  # Run only standalone tests (no Docker needed)

const { execSync } = require('child_process');
const path = require('path');
const net = require('net');

const projectRoot = path.resolve(__dirname, '..');

function checkPort(host, port) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(2000);
    socket.on('connect', () => { socket.destroy(); resolve(true); });
    socket.on('timeout', () => { socket.destroy(); resolve(false); });
    socket.on('error', () => { socket.destroy(); resolve(false); });
    socket.connect(port, host);
  });
}

async function main() {
  const isQuick = process.argv.includes('--quick');

  console.log('╔══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║           INTERNTRACK — MASTER COMPREHENSIVE SYSTEM TEST                    ║');
  console.log('║   PES University DBMS Level 3 | Candidate: Sumukh Shandilya                 ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════════╝');
  console.log();

  const results = [];

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // PHASE 1: Standalone Tests (always runs — no Docker needed)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  console.log('━'.repeat(78));
  console.log('PHASE 1: Standalone Verification Tests (Auth, Embeddings, Code Structure)');
  console.log('━'.repeat(78));
  try {
    const output = execSync(
      'node --test tests/standalone_audit.test.js',
      { cwd: projectRoot, encoding: 'utf-8', timeout: 30000, stdio: 'pipe' }
    );
    const passMatch = output.match(/pass (\d+)/);
    const failMatch = output.match(/fail (\d+)/);
    const passed = passMatch ? parseInt(passMatch[1]) : 0;
    const failed = failMatch ? parseInt(failMatch[1]) : 0;
    results.push({ phase: 'Standalone (Auth/Embeddings/Schema)', passed, failed, status: failed === 0 ? 'PASS' : 'FAIL' });
    console.log(`  ✅ Standalone Tests: ${passed} passed, ${failed} failed\n`);
  } catch (err) {
    const output = err.stdout || err.stderr || '';
    const passMatch = output.match(/pass (\d+)/);
    const failMatch = output.match(/fail (\d+)/);
    const passed = passMatch ? parseInt(passMatch[1]) : 0;
    const failed = failMatch ? parseInt(failMatch[1]) : 0;
    results.push({ phase: 'Standalone (Auth/Embeddings/Schema)', passed, failed, status: 'FAIL' });
    console.log(`  ❌ Standalone Tests: ${passed} passed, ${failed} failed\n`);
  }

  if (isQuick) {
    printSummary(results);
    return;
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // PHASE 2: Database Infrastructure Check
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  console.log('━'.repeat(78));
  console.log('PHASE 2: Database Connectivity Check');
  console.log('━'.repeat(78));

  const pgUp = await checkPort('localhost', 5432);
  const mongoUp = await checkPort('localhost', 27017);

  console.log(`  PostgreSQL (port 5432): ${pgUp ? '✅ CONNECTED' : '❌ NOT RUNNING'}`);
  console.log(`  MongoDB    (port 27017): ${mongoUp ? '✅ CONNECTED' : '❌ NOT RUNNING'}`);

  if (!pgUp || !mongoUp) {
    console.log('\n  ⚠️  Database containers are not running. Start them with:');
    console.log('       docker-compose up -d');
    console.log('       npm run db:migrate');
    console.log('       npm run db:seed');
    console.log('\n  Skipping database-dependent tests.\n');
    results.push({ phase: 'DB Connectivity', passed: 0, failed: 2, status: 'SKIP' });
    printSummary(results);
    process.exit(1);
  }

  results.push({ phase: 'DB Connectivity', passed: 2, failed: 0, status: 'PASS' });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // PHASE 3: Core Database Tests (interntrack.test.js)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  console.log('\n' + '━'.repeat(78));
  console.log('PHASE 3: Core DB Tests (Schema, Triggers, SPs, Concurrency, pgvector, MongoDB)');
  console.log('━'.repeat(78));
  try {
    const output = execSync(
      'node --test tests/interntrack.test.js',
      { cwd: projectRoot, encoding: 'utf-8', timeout: 120000, stdio: 'pipe' }
    );
    const passMatch = output.match(/pass (\d+)/);
    const failMatch = output.match(/fail (\d+)/);
    const passed = passMatch ? parseInt(passMatch[1]) : 0;
    const failed = failMatch ? parseInt(failMatch[1]) : 0;
    results.push({ phase: 'Core DB Tests', passed, failed, status: failed === 0 ? 'PASS' : 'FAIL' });
    console.log(`  ✅ Core DB Tests: ${passed} passed, ${failed} failed\n`);
    console.log(output);
  } catch (err) {
    const output = err.stdout || err.stderr || '';
    const passMatch = output.match(/pass (\d+)/);
    const failMatch = output.match(/fail (\d+)/);
    const passed = passMatch ? parseInt(passMatch[1]) : 0;
    const failed = failMatch ? parseInt(failMatch[1]) : 0;
    results.push({ phase: 'Core DB Tests', passed, failed, status: 'FAIL' });
    console.log(`  ❌ Core DB Tests: ${passed} passed, ${failed} failed\n`);
    console.log(output);
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // PHASE 4: HTTP Endpoint Integration Tests (http_routes.test.js)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  console.log('━'.repeat(78));
  console.log('PHASE 4: HTTP Endpoint Integration Tests (Auth, RBAC, Cross-Tenant)');
  console.log('━'.repeat(78));
  try {
    const output = execSync(
      'node --test tests/http_routes.test.js',
      { cwd: projectRoot, encoding: 'utf-8', timeout: 180000, stdio: 'pipe' }
    );
    const passMatch = output.match(/pass (\d+)/);
    const failMatch = output.match(/fail (\d+)/);
    const passed = passMatch ? parseInt(passMatch[1]) : 0;
    const failed = failMatch ? parseInt(failMatch[1]) : 0;
    results.push({ phase: 'HTTP Endpoint Tests', passed, failed, status: failed === 0 ? 'PASS' : 'FAIL' });
    console.log(`  ✅ HTTP Tests: ${passed} passed, ${failed} failed\n`);
    console.log(output);
  } catch (err) {
    const output = err.stdout || err.stderr || '';
    const passMatch = output.match(/pass (\d+)/);
    const failMatch = output.match(/fail (\d+)/);
    const passed = passMatch ? parseInt(passMatch[1]) : 0;
    const failed = failMatch ? parseInt(failMatch[1]) : 0;
    results.push({ phase: 'HTTP Endpoint Tests', passed, failed, status: 'FAIL' });
    console.log(`  ❌ HTTP Tests: ${passed} passed, ${failed} failed\n`);
    console.log(output);
  }

  printSummary(results);
}

function printSummary(results) {
  const totalPassed = results.reduce((s, r) => s + r.passed, 0);
  const totalFailed = results.reduce((s, r) => s + r.failed, 0);
  const totalTests = totalPassed + totalFailed;
  const allPass = totalFailed === 0;

  console.log('\n' + '╔══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                        MASTER TEST SUMMARY                                  ║');
  console.log('╠══════════════════════════════════════════════════════════════════════════════╣');
  for (const r of results) {
    const icon = r.status === 'PASS' ? '✅' : r.status === 'SKIP' ? '⏭️' : '❌';
    console.log(`║  ${icon} ${r.phase.padEnd(45)} ${String(r.passed).padStart(3)}/${String(r.passed + r.failed).padStart(3)}  ${r.status.padEnd(4)} ║`);
  }
  console.log('╠══════════════════════════════════════════════════════════════════════════════╣');
  console.log(`║  TOTAL: ${totalPassed}/${totalTests} assertions passed                                          ║`);
  console.log(`║  STATUS: ${allPass ? '✅ ALL TESTS PASSED — SYSTEM FULLY VERIFIED' : '❌ SOME TESTS FAILED — SEE DETAILS ABOVE'}              ║`);
  console.log('╚══════════════════════════════════════════════════════════════════════════════╝');

  process.exit(allPass ? 0 : 1);
}

main().catch((err) => {
  console.error('Master test runner error:', err);
  process.exit(1);
});
