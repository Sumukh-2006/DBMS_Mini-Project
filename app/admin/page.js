'use client';
// app/admin/page.js - Placement Cell Governance Dashboard
import React, { useEffect, useState } from 'react';
import Link from 'next/link';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/dashboard')
      .then((res) => res.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div style={{ color: 'var(--text-secondary)' }}>Loading governance metrics...</div>;
  }

  const { metrics, stipendStats, topCompanies, departmentStats } = data;
  const placementPct = metrics?.total_students > 0
    ? Math.round((parseInt(metrics.total_placed) / parseInt(metrics.total_students)) * 100)
    : 0;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Placement Cell Governance</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
            PES University • Experiential Learning Capstone Oversight
          </p>
        </div>

        {parseInt(metrics?.pending_verifications || 0) > 0 && (
          <Link href="/admin/verifications" className="btn btn-primary" style={{ background: '#f59e0b' }}>
            🛡️ {metrics.pending_verifications} Pending Verifications →
          </Link>
        )}
      </div>

      {/* Primary KPI Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px',
        marginBottom: '32px'
      }}>
        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
            Total Registered Students
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '8px', color: '#60a5fa' }}>
            {metrics?.total_students || 0}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Across 6 Engineering Departments
          </div>
        </div>

        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
            Placed Candidates
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '8px', color: '#34d399' }}>
            {metrics?.total_placed || 0}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            {placementPct}% Overall Placement Rate
          </div>
        </div>

        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
            Partner Companies
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '8px', color: '#fbbf24' }}>
            {metrics?.total_companies || 0}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            {metrics?.open_postings || 0} Active Live Postings
          </div>
        </div>

        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
            Average Placed Stipend
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '8px', color: '#818cf8' }}>
            ₹{parseFloat(stipendStats?.avg_stipend || 0).toLocaleString()}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Highest: ₹{parseFloat(stipendStats?.max_stipend || 0).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Top Companies and Department Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
        {/* Top Hiring Companies */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>🏆 Top Hiring Companies (v_company_stats)</h2>
            <Link href="/admin/export?type=companies" style={{ fontSize: '0.8rem', color: '#fbbf24', fontWeight: 600 }}>
              Export CSV →
            </Link>
          </div>

          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Industry</th>
                  <th>Offers Accepted</th>
                  <th>Acceptance Rate</th>
                </tr>
              </thead>
              <tbody>
                {topCompanies?.map((c) => (
                  <tr key={c.company_id}>
                    <td>
                      <div style={{ fontWeight: 700, color: '#fff' }}>{c.company_name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {c.total_postings} Postings
                      </div>
                    </td>
                    <td>{c.industry}</td>
                    <td>
                      <strong style={{ color: '#34d399' }}>{c.total_offers_accepted} Placed</strong>
                    </td>
                    <td>
                      <span className="badge badge-interview">
                        {c.offer_acceptance_rate_pct}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Management Shortcuts */}
        <div className="glass-card">
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px' }}>
            ⚡ Governance Tools
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <Link
              href="/admin/verifications"
              className="glass-card"
              style={{
                padding: '16px',
                background: 'rgba(255, 255, 255, 0.02)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>Company Verification Queue</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Review employer registrations and grant recruitment access
                </div>
              </div>
              <span>🛡️ →</span>
            </Link>

            <Link
              href="/admin/policies"
              className="glass-card"
              style={{
                padding: '16px',
                background: 'rgba(255, 255, 255, 0.02)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>Placement Policy Engine</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Tune max active applications limit, offer expiry, and single-offer rule
                </div>
              </div>
              <span>⚙️ →</span>
            </Link>

            <Link
              href="/admin/analytics"
              className="glass-card"
              style={{
                padding: '16px',
                background: 'rgba(255, 255, 255, 0.02)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>Skill Demand vs Supply Gap</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  mv_skill_demand vs MongoDB resume skills frequency
                </div>
              </div>
              <span>📊 →</span>
            </Link>

            <Link
              href="/admin/audit-logs"
              className="glass-card"
              style={{
                padding: '16px',
                background: 'rgba(255, 255, 255, 0.02)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>Tamper-Evident Audit Logs</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Immutable chronological audit logs protected by triggers
                </div>
              </div>
              <span>📜 →</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
