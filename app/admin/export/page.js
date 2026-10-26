'use client';
import { useState } from 'react';

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
      icon: '🎓'
    },
    {
      type: 'applications',
      title: 'Full Lifecycle Applications Master Export',
      desc: 'Comprehensive application tracking records across all stages (Applied, Shortlisted, Interview, Offered, Accepted, Rejected, Withdrawn) with match scores.',
      badge: 'Audited Pipeline',
      columns: ['Application ID', 'USN', 'Candidate', 'Company', 'Posting', 'Stage', 'Match Score', 'Applied At'],
      icon: '📋'
    },
    {
      type: 'companies',
      title: 'Corporate Partner Performance & Acceptance Stats',
      desc: 'Aggregated analytics sourced from v_company_stats view showcasing total postings, applicants attracted, offers issued, and acceptance rates.',
      badge: 'Corporate Relations',
      columns: ['Company Name', 'Industry', 'Verified', 'Postings', 'Applicants', 'Offers Given', 'Offers Accepted', 'Acceptance %'],
      icon: '🏢'
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '0.5rem' }}>
          Audit & Compliance Data Export
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          Generate certified CSV exports for university accreditation (NBA/NAAC), placement committee reviews, and corporate audit logs.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
        {reports.map((r) => (
          <div key={r.type} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <span style={{ fontSize: '2.25rem' }}>{r.icon}</span>
                <span className="badge badge-accent" style={{ fontSize: '0.75rem' }}>{r.badge}</span>
              </div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                {r.title}
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', lineHeight: 1.5, marginBottom: '1.25rem' }}>
                {r.desc}
              </p>

              <div style={{ background: 'var(--surface-color)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '0.5rem' }}>
                  Included Fields
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                  {r.columns.map((col) => (
                    <span key={col} style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.06)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
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
              style={{ width: '100%', justifyContent: 'center' }}
            >
              {downloading === r.type ? 'Preparing CSV...' : `⬇ Download ${r.type.toUpperCase()} CSV`}
            </button>
          </div>
        ))}
      </div>

      <div className="card" style={{ background: 'rgba(16, 185, 129, 0.05)', borderColor: 'rgba(16, 185, 129, 0.2)' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--accent-color)', marginBottom: '0.5rem' }}>
          🛡 Institutional Data Privacy & Audit Guarantee
        </h3>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          All exported records strictly adhere to PES University confidentiality guidelines. Passwords and internal cryptographic salts are never exposed in reports. Sensitive student data exports are recorded in the PostgreSQL <code>audit_log</code> table for full accountability.
        </p>
      </div>
    </div>
  );
}
