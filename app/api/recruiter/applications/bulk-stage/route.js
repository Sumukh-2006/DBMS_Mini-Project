// app/api/recruiter/applications/bulk-stage/route.js
import { NextResponse } from 'next/server';
const { pool } = require('../../../../../lib/db');
const { requireAuth } = require('../../../../../lib/auth');

export async function POST(request) {
  let client = null;
  let inTransaction = false;

  try {
    const user = requireAuth(request, ['recruiter', 'admin']);
    const body = await request.json().catch(() => ({}));
    const { applicationIds, newStage, reason } = body;

    if (!Array.isArray(applicationIds) || applicationIds.length === 0 || !newStage) {
      return NextResponse.json(
        { error: 'Array of applicationIds and newStage are required' },
        { status: 400 }
      );
    }

    const validStages = ['Applied', 'Shortlisted', 'Interview', 'Offered', 'Accepted', 'Rejected', 'Withdrawn'];
    if (!validStages.includes(newStage)) {
      return NextResponse.json(
        { error: `Invalid stage: '${newStage}'. Must be one of: ${validStages.join(', ')}` },
        { status: 400 }
      );
    }

    const parsedIds = applicationIds.map(id => parseInt(id, 10));
    if (parsedIds.some(id => isNaN(id) || id <= 0)) {
      return NextResponse.json(
        { error: 'All applicationIds must be positive integers' },
        { status: 400 }
      );
    }

    client = await pool.connect();

    // 1. Authorization & Tenant Boundary Pre-Validation
    let userCompanyId = null;
    if (user.role === 'recruiter') {
      const rec = await client.query('SELECT company_id FROM recruiter WHERE user_id = $1', [user.userId]);
      if (rec.rows.length === 0) {
        return NextResponse.json({ error: 'Recruiter profile not found' }, { status: 404 });
      }
      userCompanyId = rec.rows[0].company_id;

      // Verify all applications exist and belong to the recruiter's company
      const checkRes = await client.query(
        `SELECT a.application_id, p.company_id 
         FROM application a 
         JOIN internship_posting p ON a.posting_id = p.posting_id 
         WHERE a.application_id = ANY($1::int[])`,
        [parsedIds]
      );

      const foundAppMap = new Map(checkRes.rows.map(r => [r.application_id, r.company_id]));
      for (const appId of parsedIds) {
        const compId = foundAppMap.get(appId);
        if (!compId || compId !== userCompanyId) {
          return NextResponse.json(
            { error: 'Forbidden: You do not have permission to modify applications belonging to another company.' },
            { status: 403 }
          );
        }
      }
    }

    // 2. Begin Transaction Block
    await client.query('BEGIN');
    inTransaction = true;

    // Set local session variable so audit triggers record the authenticated user
    await client.query(`SET LOCAL interntrack.current_user_id = '${user.userId}'`);

    const results = {
      successful: [],
      failed: [],
    };

    for (const appId of parsedIds) {
      const savepointName = `sp_${appId}`;
      try {
        // Savepoint created strictly inside an active transaction block
        await client.query(`SAVEPOINT ${savepointName}`);

        // Execute stored procedure sp_advance_stage
        await client.query(
          `CALL sp_advance_stage($1, $2::application_stage, $3, $4);`,
          [appId, newStage, user.userId, reason || 'Bulk stage progression']
        );

        // Release savepoint upon success
        await client.query(`RELEASE SAVEPOINT ${savepointName}`);
        results.successful.push(appId);
      } catch (itemErr) {
        // Rollback only this candidate's savepoint so other valid transitions can proceed
        await client.query(`ROLLBACK TO SAVEPOINT ${savepointName}`);
        results.failed.push({
          applicationId: appId,
          error: itemErr.message || 'Illegal stage transition'
        });
      }
    }

    // Commit transaction for successfully processed candidates
    await client.query('COMMIT');
    inTransaction = false;

    return NextResponse.json({
      message: `Bulk stage update completed: ${results.successful.length} succeeded, ${results.failed.length} failed.`,
      results,
    });
  } catch (err) {
    if (client && inTransaction) {
      try {
        await client.query('ROLLBACK');
      } catch (rollbackErr) {
        console.error('Rollback failed:', rollbackErr);
      }
      inTransaction = false;
    }
    console.error('Bulk stage advance error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: err.status || 500 });
  } finally {
    if (client) {
      client.release();
    }
  }
}
