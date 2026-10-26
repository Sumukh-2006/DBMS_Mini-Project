'use client';
// app/admin/analytics/page.js - Institutional Department Analytics & Skill Demand vs Supply Gap
import React, { useEffect, useState } from 'react';

export default function AdminAnalyticsPage() {
  const [deptStats, setDeptStats] = useState([]);
  const [skillGap, setSkillGap] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshMessage, setRefreshMessage] = useState('');

  const loadData = () => {
    return Promise.all([
      fetch('/api/admin/analytics/department').then((r) => r.json()),
      fetch('/api/admin/analytics/skill-demand').then((r) => r.json()),
    ])
      .then(([deptData, skillData]) => {
        setDeptStats(deptData.departments || []);
        setSkillGap(skillData.skillDemandVsSupply || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRefreshMv = async () => {
    setRefreshing(true);
    setRefreshMessage('');
    try {
      const res = await fetch('/api/admin/analytics/skill-demand', { method: 'POST' });
      const d = await res.json();
      if (res.ok) {
        setRefreshMessage(`✓ Refreshed in ${d.durationMs}ms at ${new Date(d.refreshedAt).toLocaleTimeString()}`);
        await loadData();
      } else {
        setRefreshMessage(`Failed: ${d.error}`);
      }
    } catch (e) {
      setRefreshMessage(`Error: ${e.message}`);
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return <div style={{ color: 'var(--text-secondary)' }}>Loading institutional analytics...</div>;
  }

  return (
    <div>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Institutional Placement Analytics</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
          Cross-paradigm analytical synthesis uniting PostgreSQL views, materialized views, and MongoDB aggregations
        </p>
      </div>

      {/* 1. Department Placement Analytics (v_department_placement) */}
      <section style={{ marginBottom: '40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
              🏛️ Department-wise Placement Breakdown (v_department_placement)
            </h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Real-time calculations across departments, student registrations, accepted offers, and average compensation
            </p>
          </div>
        </div>

        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Department</th>
                <th>Registered Students</th>
                <th>Placed Candidates</th>
                <th>Placement %</th>
                <th>Average Placed Stipend</th>
                <th>Highest Placed Stipend</th>
              </tr>
            </thead>
            <tbody>
              {deptStats.map((d) => (
                <tr key={d.dept_id}>
                  <td>
                    <div style={{ fontWeight: 700, color: '#fff' }}>{d.dept_name}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Code: {d.dept_code}</div>
                  </td>
                  <td>{d.total_students} Students</td>
                  <td>
                    <strong style={{ color: '#34d399' }}>{d.placed_students} Placed</strong>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="badge badge-accepted">{d.placement_percentage}%</span>
                      <div style={{ width: '80px', height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${d.placement_percentage}%`, height: '100%', background: '#10b981' }} />
                      </div>
                    </div>
                  </td>
                  <td>
                    <strong style={{ color: '#818cf8' }}>
                      ₹{parseFloat(d.avg_placed_stipend).toLocaleString()}
                    </strong>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>/mo</span>
                  </td>
                  <td>
                    <strong style={{ color: '#fbbf24' }}>
                      ₹{parseFloat(d.max_placed_stipend).toLocaleString()}
                    </strong>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 2. Skill Market Demand vs Student Supply Gap (mv_skill_demand + MongoDB) */}
      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
              🎯 Skill Demand vs. Supply Gap Analysis (Polyglot Synthesis)
            </h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Compares corporate role demands (<code style={{ color: '#818cf8' }}>mv_skill_demand</code> in PostgreSQL) with candidate competencies (<code style={{ color: '#10b981' }}>resumes</code> aggregation in MongoDB)
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {refreshMessage && (
              <span style={{ fontSize: '0.82rem', color: refreshMessage.startsWith('✓') ? '#34d399' : '#f87171' }}>
                {refreshMessage}
              </span>
            )}
            <button
              onClick={handleRefreshMv}
              disabled={refreshing}
              className="btn btn-secondary"
              style={{ fontSize: '0.82rem', padding: '6px 14px' }}
            >
              {refreshing ? 'Refreshing MV...' : '⚡ Refresh Materialized View'}
            </button>
          </div>
        </div>

        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Skill Name & Category</th>
                <th>Corporate Postings Demanding</th>
                <th>Mandatory Requirements</th>
                <th>Student Resumes Featuring Skill</th>
                <th>Market Supply Gap</th>
                <th>Analysis</th>
              </tr>
            </thead>
            <tbody>
              {skillGap.map((s) => {
                const isUnderSupplied = s.market_gap > 0;
                return (
                  <tr key={s.skill_id}>
                    <td>
                      <div style={{ fontWeight: 700, color: '#fff' }}>{s.skill_name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Category: {s.skill_category}</div>
                    </td>
                    <td>
                      <strong>{s.demand_postings_count} Postings</strong>
                    </td>
                    <td>
                      <span style={{ color: '#f472b6' }}>{s.mandatory_demand_count} Mandatory</span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}> ({s.preferred_demand_count} Preferred)</span>
                    </td>
                    <td>
                      <strong style={{ color: '#60a5fa' }}>{s.student_supply_count} Candidates</strong>
                    </td>
                    <td>
                      <span className={isUnderSupplied ? 'badge badge-rejected' : 'badge badge-accepted'}>
                        {isUnderSupplied ? `-${s.market_gap} Deficit` : `+${Math.abs(s.market_gap)} Surplus`}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.8rem', color: isUnderSupplied ? '#f87171' : '#34d399' }}>
                        {isUnderSupplied ? 'High Employer Demand' : 'Adequate Supply'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
