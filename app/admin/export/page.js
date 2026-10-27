'use client';
// app/admin/export/page.js - Institutional Audit & Compliance Export Console
import React, { useState } from 'react';
import PageHeader from '../../../components/PageHeader';
import {
  IconDownload,
  IconFileSpreadsheet,
  IconShieldLock,
  IconSchool,
  IconClipboardList,
  IconBuildingSkyscraper,
} from '@tabler/icons-react';

export default function ExportReportsPage() {
  const [downloading, setDownloading] = useState(null);

  const handleDownload = async (type) => {
    try {
      setDownloading(type);
      const res = await fetch(`/api/admin/reports/export?type=${type}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to export report');
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `interntrack_${type}_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (err) {
      alert(`Export Error: ${err.message}`);
    } finally {
      setDownloading(null);
    }
  };

  const reports = [
    {
      type: 'placements',
      title: 'Placed Students Registry (Offers Accepted)',
      desc: 'Complete audited list of students with confirmed accepted offers, including USN, department, CGPA, recruiter, stipend, and placement timestamp.',
      badge: 'University Official',
      columns: ['USN', 'Student Name', 'Department', 'CGPA', 'Company', 'Role', 'Stipend', 'Placement Date'],
      icon: IconSchool,
      color: 'var(--slate-blue)',
    },
    {
      type: 'applications',
      title: 'Full Lifecycle Applications Master Export',
      desc: 'Comprehensive application tracking records across all stages (Applied, Shortlisted, Interview, Offered, Accepted, Rejected, Withdrawn) with match scores.',
      badge: 'Audited Pipeline',
      columns: ['Application ID', 'USN', 'Candidate', 'Company', 'Posting', 'Stage', 'Match Score', 'Applied At'],
      icon: IconClipboardList,
      color: 'var(--coral)',
    },
    {
      type: 'companies',
      title: 'Corporate Partner Performance & Acceptance Stats',
      desc: 'Aggregated analytics sourced from v_company_stats view showcasing total postings, applicants attracted, offers issued, and acceptance rates.',
      badge: 'Corporate Relations',
      columns: ['Company Name', 'Industry', 'Verified', 'Postings', 'Applicants', 'Offers Given', 'Offers Accepted', 'Acceptance %'],
      icon: IconBuildingSkyscraper,
      color: '#0f766e',
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      <PageHeader
        title="Audit & Compliance Data Export"
        subtitle="Generate certified CSV exports for university accreditation (NBA/NAAC), placement committee reviews, and corporate audit logs"
        badge={
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="live-indicator-dot" />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', letterSpacing: '0.04em' }}>
              ACCREDITATION EXPORTS
            </span>
          </div>
        }
      />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: '20px',
        }}
      >
        {reports.map((r) => {
          const Icon = r.icon;
          return (
            <div
              key={r.type}
              className="card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '24px',
              }}
            >
              <div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '16px',
                  }}
                >
                  <div
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '10px',
                      background: 'var(--surface-subtle)',
                      border: '1px solid var(--border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: r.color,
                    }}
                  >
                    <Icon size={22} />
                  </div>
                  <span className="mono-badge">{r.badge}</span>
                </div>

                <h2 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--ink)', marginBottom: '8px' }}>
                  {r.title}
                </h2>
                <p
                  style={{
                    color: 'var(--ink-muted)',
                    fontSize: '0.85rem',
                    lineHeight: 1.55,
                    marginBottom: '18px',
                  }}
                >
                  {r.desc}
                </p>

                <div
                  style={{
                    background: 'var(--surface-subtle)',
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-button)',
                    border: '1px solid var(--border)',
                    marginBottom: '20px',
                  }}
                >
                  <div
                    style={{
                      fontSize: '0.72rem',
                      fontFamily: 'var(--font-mono)',
                      textTransform: 'uppercase',
                      color: 'var(--ink-muted)',
                      fontWeight: 600,
                      marginBottom: '8px',
                      letterSpacing: '0.04em',
                    }}
                  >
                    Included Certified Schema Columns
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {r.columns.map((col) => (
                      <span
                        key={col}
                        style={{
                          fontSize: '0.72rem',
                          fontFamily: 'var(--font-mono)',
                          background: 'var(--surface)',
                          border: '1px solid var(--border)',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          color: 'var(--ink)',
                        }}
                      >
                        {col}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleDownload(r.type)}
                disabled={downloading === r.type}
                className="btn btn-primary"
                style={{
                  width: '100%',
                  justifyContent: 'center',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <IconDownload size={16} />
                <span>
                  {downloading === r.type ? 'Preparing Certified CSV...' : `Download ${r.type.toUpperCase()} CSV`}
                </span>
              </button>
            </div>
          );
        })}
      </div>

      <div
        className="card"
        style={{
          padding: '20px 24px',
          background: 'rgba(59, 107, 143, 0.04)',
          borderColor: 'rgba(59, 107, 143, 0.2)',
          display: 'flex',
          gap: '16px',
          alignItems: 'flex-start',
        }}
      >
        <div style={{ color: 'var(--slate-blue)', marginTop: '2px' }}>
          <IconShieldLock size={22} />
        </div>
        <div>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--ink)', marginBottom: '4px' }}>
            Institutional Data Privacy & Cryptographic Audit Guarantee
          </h3>
          <p style={{ fontSize: '0.84rem', color: 'var(--ink-muted)', lineHeight: 1.6 }}>
            All exported records strictly adhere to PES University confidentiality guidelines. Passwords and internal cryptographic salts are never exposed in reports. Sensitive student data exports are recorded in the PostgreSQL <code>audit_log</code> table for full accountability.
          </p>
        </div>
      </div>
    </div>
  );
}
