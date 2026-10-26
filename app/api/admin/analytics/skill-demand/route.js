// app/api/admin/analytics/skill-demand/route.js
import { NextResponse } from 'next/server';
const { query } = require('../../../../../lib/db');
const { requireAuth } = require('../../../../../lib/auth');
const { getResumeSkillsFrequency } = require('../../../../../lib/aggregations');

export async function GET(request) {
  try {
    requireAuth(request, ['admin', 'recruiter']);

    // 1. Skill demand from PostgreSQL Materialized View
    const demandRes = await query(`
      SELECT 
        skill_id,
        skill_name,
        skill_category,
        demand_postings_count,
        mandatory_demand_count,
        preferred_demand_count,
        avg_required_proficiency,
        last_refreshed_at
      FROM mv_skill_demand
      ORDER BY demand_postings_count DESC
      LIMIT 20;
    `);

    // 2. Skill supply from MongoDB resumes collection aggregation pipeline
    const resumeSkills = await getResumeSkillsFrequency();
    const supplyMap = {};
    resumeSkills.forEach(r => {
      supplyMap[r.skill.toLowerCase()] = r.frequency;
    });

    // 3. Synthesize Demand vs Supply comparison
    const comparison = demandRes.rows.map(row => {
      const supplyCount = supplyMap[row.skill_name.toLowerCase()] || 0;
      return {
        ...row,
        student_supply_count: supplyCount,
        // Gap = Demand postings - Student supply
        market_gap: row.demand_postings_count - supplyCount,
      };
    });

    return NextResponse.json({
      skillDemandVsSupply: comparison,
      mongoSupplySummary: resumeSkills,
    });
  } catch (err) {
    console.error('Skill demand analytics error:', err);
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  }
}

export async function POST(request) {
  try {
    const user = requireAuth(request, ['admin']);

    const start = Date.now();
    await query('SELECT sp_refresh_skill_demand_mv();');
    const duration = Date.now() - start;

    await query(
      `INSERT INTO audit_log (action, entity, entity_id, actor_id, details)
       VALUES ('MATERIALIZED_VIEW_REFRESHED', 'mv_skill_demand', NULL, $1, $2)`,
      [user.userId, JSON.stringify({ durationMs: duration, timestamp: new Date() })]
    );

    return NextResponse.json({
      message: 'Materialized view mv_skill_demand refreshed concurrently in PostgreSQL.',
      durationMs: duration,
      refreshedAt: new Date(),
    });
  } catch (err) {
    console.error('Refresh materialized view error:', err);
    return NextResponse.json({ error: err.message }, { status: err.status || 500 });
  }
}
