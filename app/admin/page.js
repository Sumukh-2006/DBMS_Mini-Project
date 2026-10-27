'use client';
// app/admin/page.js - Placement Cell Governance Dashboard
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import PageHeader from '../../components/PageHeader';
import StatCard from '../../components/StatCard';
import StatusBadge from '../../components/StatusBadge';
import {
  IconUsers,
  IconCircleCheck,
  IconBuildingSkyscraper,
  IconCurrencyRupee,
  IconShieldCheck,
  IconAdjustments,
  IconChartDots,
  IconFileText,
  IconArrowRight,
  IconDownload,
  IconAlertTriangle,
} from '@tabler/icons-react';

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
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '60px 0', justifyContent: 'center' }}>
        <span className="live-indicator-dot" />
        <span style={{ color: 'var(--ink-muted)', fontSize: '0.9rem', fontFamily: 'var(--font-mono)' }}>
          Loading governance metrics...
        </span>
      </div>
    );
  }

  const { metrics, stipendStats, topCompanies, departmentStats } = data || {};
  const placementPct = metrics?.total_students > 0
    ? Math.round((parseInt(metrics.total_placed) / parseInt(metrics.total_students)) * 100)
    : 0;

  const pendingCount = parseInt(metrics?.pending_verifications || 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      <PageHeader
        title="Placement Cell Governance"
        subtitle="PES University • Experiential Learning DBMS Placement Oversight"
        badge={
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="live-indicator-dot" />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', letterSpacing: '0.04em' }}>
              SUPERUSER CONSOLE
            </span>
          </div>
        }
        actions={
          pendingCount > 0 && (
            <Link
              href="/admin/verifications"
              className="btn btn-primary btn-sm"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: '#b45309',
                borderColor: '#b45309',
              }}
            >
              <IconShieldCheck size={16} />
              <span>{pendingCount} Pending Vetting{pendingCount > 1 ? 's' : ''}</span>
              <IconArrowRight size={14} />
            </Link>
          )
        }
      />

      {/* Primary KPI Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '16px',
        }}
      >
        <StatCard
          label="Total Registered Students"
          value={metrics?.total_students || 0}
          icon={IconUsers}
          description="Across 6 Engineering Departments"
        />
        <StatCard
          label="Placed Candidates"
          value={metrics?.total_placed || 0}
          icon={IconCircleCheck}
          change={`${placementPct}% Placement Rate`}
          changeType="positive"
          description="Confirmed student acceptances"
        />
        <StatCard
          label="Partner Companies"
          value={metrics?.total_companies || 0}
          icon={IconBuildingSkyscraper}
          description={`${metrics?.open_postings || 0} active live postings`}
        />
        <StatCard
          label="Average Placed Stipend"
          value={`₹${parseFloat(stipendStats?.avg_stipend || 0).toLocaleString()}`}
          icon={IconCurrencyRupee}
          description={`Peak: ₹${parseFloat(stipendStats?.max_stipend || 0).toLocaleString()}/mo`}
        />
      </div>

      {/* Main Grid: Top Companies & Governance Shortcuts */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
          gap: '24px',
        }}
      >
        {/* Top Hiring Companies */}
        <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '18px',
              paddingBottom: '12px',
              borderBottom: '1px solid var(--border)',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ fontSize: '1.05rem', fontWeight: 600 }}>Top Hiring Partners</h2>
                <span className="mono-badge">v_company_stats</span>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--ink-muted)', marginTop: '2px' }}>
                Ranked by confirmed offer acceptances
              </p>
            </div>
            <Link
              href="/admin/export?type=companies"
              className="btn btn-secondary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <IconDownload size={14} />
              <span>Export CSV</span>
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
                      <div style={{ fontWeight: 600, color: 'var(--ink)' }}>{c.company_name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--ink-muted)', fontFamily: 'var(--font-mono)' }}>
                        {c.total_postings} {c.total_postings === 1 ? 'posting' : 'postings'}
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.82rem', color: 'var(--ink-muted)' }}>{c.industry}</span>
                    </td>
                    <td>
                      <strong style={{ color: '#0f766e', fontFamily: 'var(--font-mono)' }}>
                        {c.total_offers_accepted} Placed
                      </strong>
                    </td>
                    <td>
                      <StatusBadge status="interview" label={`${c.offer_acceptance_rate_pct}%`} />
                    </td>
                  </tr>
                ))}
                {(!topCompanies || topCompanies.length === 0) && (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', color: 'var(--ink-muted)', padding: '24px' }}>
                      No company hiring stats available yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Governance Controls Panel */}
        <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              marginBottom: '18px',
              paddingBottom: '12px',
              borderBottom: '1px solid var(--border)',
            }}
          >
            <h2 style={{ fontSize: '1.05rem', fontWeight: 600 }}>Governance Modules</h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--ink-muted)', marginTop: '2px' }}>
              Constitutional policy tuning, partner vetting & compliance logging
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <Link
              href="/admin/verifications"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 16px',
                borderRadius: 'var(--radius-button)',
                border: '1px solid var(--border)',
                background: 'var(--surface-subtle)',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    background: 'rgba(59, 107, 143, 0.1)',
                    color: 'var(--slate-blue)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <IconShieldCheck size={20} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--ink)' }}>
                    Company Verification Queue
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--ink-muted)' }}>
                    Review employer registrations and grant recruitment access
                  </div>
                </div>
              </div>
              <IconArrowRight size={16} color="var(--ink-muted)" />
            </Link>

            <Link
              href="/admin/policies"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 16px',
                borderRadius: 'var(--radius-button)',
                border: '1px solid var(--border)',
                background: 'var(--surface-subtle)',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    background: 'rgba(217, 45, 32, 0.08)',
                    color: 'var(--coral)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <IconAdjustments size={20} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--ink)' }}>
                    Placement Policy Engine
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--ink-muted)' }}>
                    Tune max active applications, offer expiry, and single-offer rule
                  </div>
                </div>
              </div>
              <IconArrowRight size={16} color="var(--ink-muted)" />
            </Link>

            <Link
              href="/admin/analytics"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 16px',
                borderRadius: 'var(--radius-button)',
                border: '1px solid var(--border)',
                background: 'var(--surface-subtle)',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    background: 'rgba(16, 185, 129, 0.1)',
                    color: '#0f766e',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <IconChartDots size={20} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--ink)' }}>
                    Skill Demand vs Supply Gap
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--ink-muted)' }}>
                    Materialized view vs MongoDB resume skills frequency
                  </div>
                </div>
              </div>
              <IconArrowRight size={16} color="var(--ink-muted)" />
            </Link>

            <Link
              href="/admin/audit-logs"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 16px',
                borderRadius: 'var(--radius-button)',
                border: '1px solid var(--border)',
                background: 'var(--surface-subtle)',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    background: 'rgba(10, 10, 10, 0.05)',
                    color: 'var(--ink)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <IconFileText size={20} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--ink)' }}>
                    Tamper-Evident Audit Logs
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--ink-muted)' }}>
                    Immutable chronological audit logs protected by triggers
                  </div>
                </div>
              </div>
              <IconArrowRight size={16} color="var(--ink-muted)" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
