// app/api/recruiter/applications/bulk-stage/route.js
import { NextResponse } from 'next/server';
const { pool } = require('../../../../../lib/db');
const { requireAuth } = require('../../../../../lib/auth');

export async function POST(request) {
  const client = await pool.connect();
  try {
    const user = requireAuth(request, ['recruiter', 'admin']);
    const body = await request.json();
    const { applicationIds, newStage, reason } = body;

    if (!Array.isArray(applicationIds) || applicationIds.length === 0 || !newStage) {
      return NextResponse.json({ error: 'Array of applicationIds and newStage are required' }, { status: 400 });
    }

    const results = {
      successful: [],
      failed: [],
    };

    await client.query('BEGIN');

    for (const appId of applicationIds) {
      const savepointName = `sp_${appId}`;
      try {
        // Create savepoint for isolated candidate processing
        await client.query(`SAVEPOINT ${savepointName}`);

        // Set local session variable so trigger records correct user
        await client.query(`SET LOCAL interntrack.current_user_id = '${user.userId}'`);

        // Execute sp_advance_stage
        await client.query(
          `CALL sp_advance_stage($1, $2::application_stage, $3, $4);`,
          [parseInt(appId), newStage, user.userId, reason || 'Bulk stage progression']
        );

        // Release savepoint on success
        await client.query(`RELEASE SAVEPOINT ${savepointName}`);
        results.successful.push(appId);
      } catch (itemErr) {
        // Rollback only this candidate's savepoint so other updates proceed
        await client.query(`ROLLBACK TO SAVEPOINT ${savepointName}`);
        results.failed.push({
          applicationId: appId,
          error: itemErr.message || 'Illegal stage transition'
        });
      }
    }

    await client.query('COMMIT');

    return NextResponse.json({
      message: `Bulk stage update completed: ${results.successful.length} succeeded, ${results.failed.length} failed.`,
      results,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Bulk stage advance error:', err);
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  } finally {
    client.release();
  }
}
