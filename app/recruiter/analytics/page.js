'use client';
// app/recruiter/analytics/page.js - Funnel Conversion Analytics from v_posting_funnel
import React, { useEffect, useState } from 'react';

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
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Recruitment Funnel Analytics</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
          Conversion rate analysis and candidate drop-off metrics backed by PostgreSQL view v_posting_funnel
        </p>
      </div>

      {loading ? (
        <div style={{ color: 'var(--text-secondary)' }}>Aggregating pipeline metrics...</div>
      ) : funnelData.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>📈</div>
          <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>No funnel data available</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          {funnelData.map((f) => {
            const total = parseInt(f.total_applicants) || 1;
            const appliedPct = Math.round((parseInt(f.count_applied) / total) * 100);
            const shortPct = Math.round((parseInt(f.count_shortlisted) / total) * 100);
            const intPct = Math.round((parseInt(f.count_interview) / total) * 100);
            const offerPct = Math.round((parseInt(f.count_offered) / total) * 100);
            const acceptPct = Math.round((parseInt(f.count_accepted) / total) * 100);

            return (
              <div key={f.posting_id} className="glass-card" style={{ padding: '28px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div>
                    <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#fff' }}>{f.title}</h2>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      Openings: {f.filled} / {f.openings} Filled • Deadline: {new Date(f.deadline).toLocaleDateString()}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#34d399' }}>
                      {f.conversion_rate_pct}%
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                      Placement Conversion
                    </div>
                  </div>
                </div>

                {/* Visual Funnel Stack */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px' }}>
                  {/* Applied Bar */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '4px' }}>
                      <span>Applied (Initial Submissions)</span>
                      <strong>{f.count_applied} candidates ({appliedPct}%)</strong>
                    </div>
                    <div style={{ height: '10px', background: 'rgba(255,255,255,0.06)', borderRadius: '6px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${Math.max(appliedPct, 3)}%`, background: '#60a5fa', borderRadius: '6px' }} />
                    </div>
                  </div>

                  {/* Shortlisted Bar */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '4px' }}>
                      <span>Shortlisted (Resume / Skill Matched)</span>
                      <strong>{f.count_shortlisted} candidates ({shortPct}%)</strong>
                    </div>
                    <div style={{ height: '10px', background: 'rgba(255,255,255,0.06)', borderRadius: '6px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${Math.max(shortPct, 3)}%`, background: '#c084fc', borderRadius: '6px' }} />
                    </div>
                  </div>

                  {/* Interview Bar */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '4px' }}>
                      <span>Interview (Technical Rounds)</span>
                      <strong>{f.count_interview} candidates ({intPct}%)</strong>
                    </div>
                    <div style={{ height: '10px', background: 'rgba(255,255,255,0.06)', borderRadius: '6px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${Math.max(intPct, 3)}%`, background: '#fbbf24', borderRadius: '6px' }} />
                    </div>
                  </div>

                  {/* Offered Bar */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '4px' }}>
                      <span>Offered (Pending Acceptance)</span>
                      <strong>{f.count_offered} candidates ({offerPct}%)</strong>
                    </div>
                    <div style={{ height: '10px', background: 'rgba(255,255,255,0.06)', borderRadius: '6px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${Math.max(offerPct, 3)}%`, background: '#f472b6', borderRadius: '6px' }} />
                    </div>
                  </div>

                  {/* Accepted Bar */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '4px' }}>
                      <span>Accepted (Final Placement Finalized)</span>
                      <strong>{f.count_accepted} candidates ({acceptPct}%)</strong>
                    </div>
                    <div style={{ height: '10px', background: 'rgba(255,255,255,0.06)', borderRadius: '6px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${Math.max(acceptPct, 3)}%`, background: '#34d399', borderRadius: '6px' }} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
