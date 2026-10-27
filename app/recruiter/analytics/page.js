'use client';

import React, { useEffect, useState } from 'react';
import PageHeader from '../../../components/PageHeader';
import EmptyState from '../../../components/EmptyState';
import {
  IconChartBar,
  IconClock,
  IconTrendingUp,
} from '@tabler/icons-react';

export default function RecruiterAnalyticsPage() {
  const [funnelData, setFunnelData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/recruiter/analytics/funnel')
      .then((res) => res.json())
      .then((data) => {
        setFunnelData(data.funnel || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      <PageHeader
        eyebrow="Conversion Metrics • PostgreSQL View v_posting_funnel"
        title="Recruitment Funnel Analytics"
        subtitle="Conversion rate analysis and candidate drop-off metrics backed by PostgreSQL view v_posting_funnel"
        action={
          <div
            style={{
              fontFamily: 'var(--font-mono), monospace',
              fontSize: '0.74rem',
              color: 'var(--ink-muted)',
              padding: '6px 14px',
              borderRadius: '999px',
              backgroundColor: 'var(--surface-subtle)',
              border: '1px solid var(--border)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <IconTrendingUp size={14} color="#047857" />
            <span>Real-time SQL View</span>
          </div>
        }
      />

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {[1, 2].map((i) => (
            <div key={i} style={{ height: '200px', background: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }} />
          ))}
        </div>
      ) : funnelData.length === 0 ? (
        <EmptyState
          icon={<IconChartBar size={28} />}
          title="No funnel data available"
          description="Create postings and receive candidate applications to generate conversion rate analytics."
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {funnelData.map((f) => {
            const total = parseInt(f.total_applicants) || 1;
            const appliedPct = Math.round((parseInt(f.count_applied) / total) * 100);
            const shortPct = Math.round((parseInt(f.count_shortlisted) / total) * 100);
            const intPct = Math.round((parseInt(f.count_interview) / total) * 100);
            const offerPct = Math.round((parseInt(f.count_offered) / total) * 100);
            const acceptPct = Math.round((parseInt(f.count_accepted) / total) * 100);

            const stages = [
              { label: 'Applied (Initial Submissions)', count: f.count_applied, pct: appliedPct, color: '#3b6b8f' },
              { label: 'Shortlisted (Resume / Skill Matched)', count: f.count_shortlisted, pct: shortPct, color: '#6366f1' },
              { label: 'Interview (Technical Rounds)', count: f.count_interview, pct: intPct, color: '#d97706' },
              { label: 'Offered (Pending Acceptance)', count: f.count_offered, pct: offerPct, color: '#e11d48' },
              { label: 'Accepted (Placement Finalized)', count: f.count_accepted, pct: acceptPct, color: '#047857' },
            ];

            return (
              <div key={f.posting_id} className="card" style={{ padding: '28px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
                  <div>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--ink)', margin: 0 }}>
                      {f.title}
                    </h2>
                    <div
                      style={{
                        fontFamily: 'var(--font-mono), monospace',
                        fontSize: '0.74rem',
                        color: 'var(--ink-muted)',
                        marginTop: '4px',
                      }}
                    >
                      Openings: {f.filled} / {f.openings} Filled • Deadline: {new Date(f.deadline).toLocaleDateString()}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div
                      style={{
                        fontFamily: 'var(--font-mono), monospace',
                        fontSize: '1.8rem',
                        fontWeight: 700,
                        color: 'var(--ink)',
                        lineHeight: 1,
                      }}
                    >
                      {f.conversion_rate_pct}%
                    </div>
                    <div
                      style={{
                        fontFamily: 'var(--font-mono), monospace',
                        fontSize: '0.66rem',
                        color: 'var(--ink-muted)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        fontWeight: 700,
                        marginTop: '4px',
                      }}
                    >
                      Placement Conversion
                    </div>
                  </div>
                </div>

                {/* Visual Funnel Stack */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '16px' }}>
                  {stages.map((st, sidx) => (
                    <div key={sidx}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontFamily: 'var(--font-mono), monospace',
                          fontSize: '0.74rem',
                          marginBottom: '4px',
                        }}
                      >
                        <span style={{ color: 'var(--ink)' }}>{st.label}</span>
                        <strong style={{ color: 'var(--ink)' }}>
                          {st.count} candidate{st.count === 1 ? '' : 's'} ({st.pct}%)
                        </strong>
                      </div>
                      <div
                        style={{
                          height: '8px',
                          backgroundColor: 'var(--surface-subtle)',
                          borderRadius: '999px',
                          overflow: 'hidden',
                          border: '1px solid var(--border)',
                        }}
                      >
                        <div
                          style={{
                            height: '100%',
                            width: `${Math.max(st.pct, 2)}%`,
                            backgroundColor: st.color,
                            borderRadius: '999px',
                            transition: 'width 0.4s ease',
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
