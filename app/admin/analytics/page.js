'use client';
// app/admin/analytics/page.js - Institutional Department Analytics & Skill Demand vs Supply Gap
import React, { useEffect, useState } from 'react';
import PageHeader from '../../../components/PageHeader';
import StatusBadge from '../../../components/StatusBadge';
import {
  IconChartBar,
  IconRefresh,
  IconSchool,
  IconTarget,
  IconCheck,
  IconAlertCircle,
} from '@tabler/icons-react';

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
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '60px 0', justifyContent: 'center' }}>
        <span className="live-indicator-dot" />
        <span style={{ color: 'var(--ink-muted)', fontSize: '0.9rem', fontFamily: 'var(--font-mono)' }}>
          Loading institutional analytics...
        </span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <PageHeader
        title="Institutional Placement Analytics"
        subtitle="Cross-paradigm analytical synthesis uniting PostgreSQL views, materialized views, and MongoDB aggregations"
        badge={
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="live-indicator-dot" />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', letterSpacing: '0.04em' }}>
              POLYGLOT ENGINE
            </span>
          </div>
        }
      />

      {/* 1. Department Placement Analytics (v_department_placement) */}
      <section className="card" style={{ padding: '24px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '20px',
            paddingBottom: '16px',
            borderBottom: '1px solid var(--border)',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <IconSchool size={20} color="var(--slate-blue)" />
              <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Department Placement Performance</h2>
              <span className="mono-badge">v_department_placement</span>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--ink-muted)', marginTop: '4px' }}>
              Real-time aggregation across departments, student registrations, accepted offers, and average compensation
            </p>
          </div>
        </div>

        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Department</th>
                <th>Registered</th>
                <th>Placed</th>
                <th>Placement %</th>
                <th>Average Stipend</th>
                <th>Peak Stipend</th>
              </tr>
            </thead>
            <tbody>
              {deptStats.map((d) => (
                <tr key={d.dept_id}>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--ink)' }}>{d.dept_name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--ink-muted)', fontFamily: 'var(--font-mono)' }}>
                      Code: {d.dept_code}
                    </div>
                  </td>
                  <td>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
                      {d.total_students} Students
                    </span>
                  </td>
                  <td>
                    <strong style={{ color: '#0f766e', fontFamily: 'var(--font-mono)' }}>
                      {d.placed_students} Placed
                    </strong>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.85rem',
                          fontWeight: 600,
                          minWidth: '42px',
                        }}
                      >
                        {d.placement_percentage}%
                      </span>
                      <div
                        style={{
                          width: '90px',
                          height: '6px',
                          background: 'rgba(10, 10, 10, 0.08)',
                          borderRadius: '3px',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            width: `${Math.min(100, Math.max(0, d.placement_percentage))}%`,
                            height: '100%',
                            background: '#0f766e',
                          }}
                        />
                      </div>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--ink)' }}>
                      ₹{parseFloat(d.avg_placed_stipend || 0).toLocaleString()}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--ink-muted)' }}>/mo</span>
                  </td>
                  <td>
                    <span style={{ fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--slate-blue)' }}>
                      ₹{parseFloat(d.max_placed_stipend || 0).toLocaleString()}
                    </span>
                  </td>
                </tr>
              ))}
              {deptStats.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: 'var(--ink-muted)', padding: '24px' }}>
                    No department placement metrics recorded.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* 2. Skill Market Demand vs Student Supply Gap (mv_skill_demand + MongoDB) */}
      <section className="card" style={{ padding: '24px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '20px',
            paddingBottom: '16px',
            borderBottom: '1px solid var(--border)',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <IconTarget size={20} color="var(--coral)" />
              <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Skill Demand vs Supply Gap</h2>
              <span className="mono-badge">mv_skill_demand + Mongo Resumes</span>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--ink-muted)', marginTop: '4px' }}>
              Compares corporate role demands (<code style={{ fontFamily: 'var(--font-mono)', color: 'var(--slate-blue)' }}>mv_skill_demand</code> in PostgreSQL) with candidate competencies (<code style={{ fontFamily: 'var(--font-mono)', color: '#0f766e' }}>resumes</code> aggregation in MongoDB)
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            {refreshMessage && (
              <span
                style={{
                  fontSize: '0.8rem',
                  fontFamily: 'var(--font-mono)',
                  color: refreshMessage.startsWith('✓') ? '#0f766e' : 'var(--coral)',
                }}
              >
                {refreshMessage}
              </span>
            )}
            <button
              onClick={handleRefreshMv}
              disabled={refreshing}
              className="btn btn-secondary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <IconRefresh size={14} className={refreshing ? 'spinning' : ''} />
              <span>{refreshing ? 'Refreshing MV...' : 'Refresh Materialized View'}</span>
            </button>
          </div>
        </div>

        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Skill Name & Category</th>
                <th>Corporate Postings</th>
                <th>Requirement Type</th>
                <th>Candidate Supply</th>
                <th>Market Supply Gap</th>
                <th>Verdict</th>
              </tr>
            </thead>
            <tbody>
              {skillGap.map((s) => {
                const isUnderSupplied = s.market_gap > 0;
                return (
                  <tr key={s.skill_id}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--ink)' }}>{s.skill_name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--ink-muted)' }}>
                        {s.skill_category}
                      </div>
                    </td>
                    <td>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                        {s.demand_postings_count} {s.demand_postings_count === 1 ? 'posting' : 'postings'}
                      </span>
                    </td>
                    <td>
                      <span style={{ color: 'var(--coral)', fontWeight: 600, fontSize: '0.82rem' }}>
                        {s.mandatory_demand_count} Mandatory
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--ink-muted)' }}>
                        {' '}({s.preferred_demand_count} Preferred)
                      </span>
                    </td>
                    <td>
                      <span style={{ color: 'var(--slate-blue)', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                        {s.student_supply_count} Candidates
                      </span>
                    </td>
                    <td>
                      <span
                        className="mono-badge"
                        style={{
                          background: isUnderSupplied ? 'rgba(217, 45, 32, 0.08)' : 'rgba(16, 185, 129, 0.08)',
                          color: isUnderSupplied ? '#b91c1c' : '#047857',
                          border: `1px solid ${isUnderSupplied ? 'rgba(217, 45, 32, 0.2)' : 'rgba(16, 185, 129, 0.2)'}`,
                          fontWeight: 600,
                        }}
                      >
                        {isUnderSupplied ? `-${s.market_gap} Deficit` : `+${Math.abs(s.market_gap)} Surplus`}
                      </span>
                    </td>
                    <td>
                      <span
                        style={{
                          fontSize: '0.8rem',
                          fontWeight: 500,
                          color: isUnderSupplied ? '#b91c1c' : '#047857',
                        }}
                      >
                        {isUnderSupplied ? 'High Employer Demand' : 'Adequate Supply'}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {skillGap.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: 'var(--ink-muted)', padding: '24px' }}>
                    No skill demand analytics available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
