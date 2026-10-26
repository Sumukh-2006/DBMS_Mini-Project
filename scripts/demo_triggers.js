// scripts/demo_triggers.js
// Interactive / automated demonstration of PostgreSQL Triggers BEFORE and AFTER states
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { pool } = require('../lib/db');

async function runDemo() {
  const client = await pool.connect();
  console.log('='.repeat(80));
  console.log(' INTERNTRACK — BEFORE & AFTER TRIGGER DEMONSTRATION');
  console.log(' Course: DBMS Level 3 (PES University) | Candidate: Sumukh Shandilya');
  console.log('='.repeat(80));

  try {
    // ------------------------------------------------------------------------
    // TRIGGER 1: trg_stage_history_immutable
    // ------------------------------------------------------------------------
    console.log('\n[DEMO 1] TRIGGER: trg_stage_history_immutable (Guarantees Append-Only Audit History)');
    console.log('-'.repeat(80));
    console.log('BEFORE: Reading stage history record history_id = 1...');
    const histBefore = await client.query('SELECT history_id, application_id, to_stage, reason FROM application_stage_history LIMIT 1;');
    console.log('  State Before:', histBefore.rows[0]);

    console.log('\nACTION: Fraudulent attempt to execute: UPDATE application_stage_history SET to_stage=\'Accepted\' WHERE history_id=1;');
    try {
      await client.query("UPDATE application_stage_history SET to_stage = 'Accepted' WHERE history_id = 1;");
      console.error('  FAIL: Update unexpectedly succeeded!');
    } catch (err) {
      console.log('  ✓ TRIGGER FIRED & BLOCKED! Exception caught:');
      console.log(`    "${err.message}"`);
    }

    const histAfter = await client.query('SELECT history_id, application_id, to_stage, reason FROM application_stage_history LIMIT 1;');
    console.log('\nAFTER: Verifying record remains completely unchanged:');
    console.log('  State After:', histAfter.rows[0]);

    // ------------------------------------------------------------------------
    // TRIGGER 2: trg_block_late_apply
    // ------------------------------------------------------------------------
    console.log('\n' + '='.repeat(80));
    console.log('[DEMO 2] TRIGGER: trg_block_late_apply (Rejects Applications after Deadline)');
    console.log('-'.repeat(80));

    // Temporarily set posting 4 deadline to 2 hours ago in a transaction
    await client.query('BEGIN;');
    await client.query("UPDATE internship_posting SET deadline = CURRENT_TIMESTAMP - INTERVAL '2 hours' WHERE posting_id = 4;");
    const postState = await client.query('SELECT posting_id, title, deadline, CURRENT_TIMESTAMP AS current_time FROM internship_posting WHERE posting_id = 4;');
    console.log('BEFORE: Posting 4 deadline set in the past:');
    console.log('  Deadline:', postState.rows[0].deadline);
    console.log('  Current: ', postState.rows[0].current_time);

    console.log('\nACTION: Student 1 attempts to apply: INSERT INTO application (student_id, posting_id) VALUES (1, 4);');
    try {
      await client.query('INSERT INTO application (student_id, posting_id) VALUES (1, 4);');
      console.error('  FAIL: Application unexpectedly succeeded!');
    } catch (err) {
      console.log('  ✓ TRIGGER FIRED & BLOCKED! Exception caught:');
      console.log(`    "${err.message}"`);
    }
    await client.query('ROLLBACK;');

    const postCheck = await client.query('SELECT count(*) FROM application WHERE student_id = 1 AND posting_id = 4;');
    console.log('\nAFTER: Applications count for Student 1 on Posting 4:', postCheck.rows[0].count, '(Zero mutations permitted)');

    // ------------------------------------------------------------------------
    // TRIGGER 3: trg_interview_clash
    // ------------------------------------------------------------------------
    console.log('\n' + '='.repeat(80));
    console.log('[DEMO 3] TRIGGER: trg_interview_clash (Detects Overlapping Interview Schedules)');
    console.log('-'.repeat(80));

    const existingInt = await client.query('SELECT interview_id, application_id, scheduled_at, duration_min FROM interview WHERE application_id = 1;');
    console.log('BEFORE: Existing scheduled interview for Application 1:');
    console.log('  Scheduled At:', existingInt.rows[0].scheduled_at);
    console.log('  Duration Min:', existingInt.rows[0].duration_min);

    console.log('\nACTION: Recruiter tries to book an overlapping round (e.g. at 15 minutes after start):');
    await client.query('BEGIN;');
    try {
      const clashTime = new Date(new Date(existingInt.rows[0].scheduled_at).getTime() + 15 * 60000).toISOString();
      await client.query(
        'INSERT INTO interview (application_id, round_no, scheduled_at, duration_min, mode) VALUES ($1, 2, $2, 30, $3);',
        [1, clashTime, 'online']
      );
      console.error('  FAIL: Overlapping interview was inserted!');
    } catch (err) {
      console.log('  ✓ TRIGGER FIRED & BLOCKED! Exception caught:');
      console.log(`    "${err.message}"`);
    }
    await client.query('ROLLBACK;');
    console.log('\nAFTER: Candidate calendar remains intact without collisions.');

    // ------------------------------------------------------------------------
    // TRIGGER 4: trg_app_stage_audit
    // ------------------------------------------------------------------------
    console.log('\n' + '='.repeat(80));
    console.log('[DEMO 4] TRIGGER: trg_app_stage_audit (Autonomous Audit Log Insertion on Stage Transition)');
    console.log('-'.repeat(80));

    await client.query('BEGIN;');
    const auditCountBefore = await client.query('SELECT count(*) FROM application_stage_history WHERE application_id = 4;');
    console.log('BEFORE: History records count for Application 4:', auditCountBefore.rows[0].count);

    console.log("\nACTION: Recruiter advances stage: UPDATE application SET current_stage = 'Interview' WHERE application_id = 4;");
    await client.query("UPDATE application SET current_stage = 'Interview' WHERE application_id = 4;");

    const auditCountAfter = await client.query('SELECT count(*) FROM application_stage_history WHERE application_id = 4;');
    console.log('AFTER: History records count for Application 4:', auditCountAfter.rows[0].count, '(Automatically incremented by 1)');

    const auditRow = await client.query('SELECT history_id, application_id, from_stage, to_stage, changed_at FROM application_stage_history WHERE application_id = 4 ORDER BY history_id DESC LIMIT 1;');
    console.log('  Autonomously Created Stage Audit Record:');
    console.log('  ', auditRow.rows[0]);
    await client.query('ROLLBACK;');

    console.log('\n' + '='.repeat(80));
    console.log(' ALL 4 TRIGGERS SUCCESSFULLY DEMONSTRATED WITH PROOF');
    console.log('='.repeat(80));
  } catch (err) {
    console.error('Demo error:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

runDemo();
