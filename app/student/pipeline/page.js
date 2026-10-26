'use client';
// app/student/pipeline/page.js - Interactive Kanban Board for Student Applications
import React, { useEffect, useState } from 'react';
import Link from 'next/link';

export default function PipelinePage() {
  const [kanban, setKanban] = useState(null);
  const [loading, setLoading] = useState(true);
  const [withdrawingId, setWithdrawingId] = useState(null);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const fetchPipeline = () => {
    setLoading(true);
    fetch('/api/student/pipeline')
      .then((res) => res.json())
      .then((data) => {
        setKanban(data.kanban || {});
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchPipeline();
  }, []);

  const handleWithdraw = async (applicationId) => {
    if (!confirm('Are you sure you want to withdraw this application? This action will be logged in your stage audit history.')) {
      return;
    }

    try {
      setWithdrawingId(applicationId);
      setMessage(null);
      setError(null);

      // Call bulk-stage or advance-stage
      const res = await fetch('/api/recruiter/applications/bulk-stage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationIds: [applicationId],
          newStage: 'Withdrawn',
          reason: 'Student initiated withdrawal from portal'
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to withdraw');

      setMessage('Application withdrawn successfully and recorded in tamper-evident history.');
      fetchPipeline();
    } catch (err) {
      setError(err.message);
    } finally {
      setWithdrawingId(null);
    }
  };

  const columns = [
    { key: 'Applied', title: 'Applied', color: '#60a5fa' },
    { key: 'Shortlisted', title: 'Shortlisted', color: '#c084fc' },
    { key: 'Interview', title: 'Interview', color: '#fbbf24' },
    { key: 'Offered', title: 'Offered', color: '#f472b6' },
    { key: 'Accepted', title: 'Accepted', color: '#34d399' },
    { key: 'Rejected', title: 'Rejected', color: '#f87171' },
    { key: 'Withdrawn', title: 'Withdrawn', color: '#9ca3af' },
  ];

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Application Pipeline Board</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
          Interactive Kanban workflow tracking stages backed by PostgreSQL views and triggers
        </p>
      </div>

      {message && (
        <div style={{
          background: 'var(--success-bg)',
          border: '1px solid var(--success)',
          color: '#6ee7b7',
          padding: '12px 18px',
          borderRadius: 'var(--radius-md)',
          marginBottom: '20px',
          fontSize: '0.9rem'
        }}>
          {message}
        </div>
      )}

      {error && (
        <div style={{
          background: 'var(--danger-bg)',
          border: '1px solid var(--danger)',
          color: '#fca5a5',
          padding: '12px 18px',
          borderRadius: 'var(--radius-md)',
          marginBottom: '20px',
          fontSize: '0.9rem'
        }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ color: 'var(--text-secondary)' }}>Loading pipeline state...</div>
      ) : (
        <div className="kanban-board">
          {columns.map((col) => {
            const cards = kanban?.[col.key] || [];
            return (
              <div key={col.key} className="kanban-column">
                <div className="kanban-header">
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: col.color }} />
                    {col.title}
                  </span>
                  <span style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    padding: '2px 8px',
                    borderRadius: '10px',
                    fontSize: '0.75rem'
                  }}>
                    {cards.length}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', minHeight: '300px' }}>
                  {cards.length === 0 ? (
                    <div style={{
                      textAlign: 'center',
                      padding: '28px 12px',
                      color: 'var(--text-muted)',
                      fontSize: '0.78rem',
                      fontStyle: 'italic',
                      border: '1px dashed var(--border-color)',
                      borderRadius: 'var(--radius-md)'
                    }}>
                      No applications
                    </div>
                  ) : (
                    cards.map((app) => (
                      <div key={app.application_id} className="kanban-card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#fff' }}>
                            {app.company_name}
                          </span>
                          <span style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: 'rgba(99, 102, 241, 0.2)',
                            color: '#a5b4fc'
                          }}>
                            {Math.round(app.match_score)}% Match
                          </span>
                        </div>

                        <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                          {app.posting_title}
                        </div>

                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Stipend: ₹{parseFloat(app.stipend).toLocaleString()}/mo
                        </div>

                        {/* Interview snippet if scheduled */}
                        {app.next_interview && (
                          <div style={{
                            fontSize: '0.72rem',
                            background: 'rgba(245, 158, 11, 0.12)',
                            color: '#fbbf24',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            marginTop: '4px'
                          }}>
                            📅 Round {app.next_interview.round_no}: {new Date(app.next_interview.scheduled_at).toLocaleDateString()}
                          </div>
                        )}

                        {/* Offer link if offered */}
                        {col.key === 'Offered' && (
                          <Link href="/student/offers" className="btn btn-primary btn-sm" style={{ marginTop: '6px', fontSize: '0.75rem' }}>
                            View Offer →
                          </Link>
                        )}

                        {/* Withdraw button for active stages */}
                        {!['Accepted', 'Rejected', 'Withdrawn'].includes(col.key) && (
                          <button
                            onClick={() => handleWithdraw(app.application_id)}
                            disabled={withdrawingId === app.application_id}
                            style={{
                              marginTop: '6px',
                              background: 'transparent',
                              border: 'none',
                              color: 'var(--text-muted)',
                              fontSize: '0.72rem',
                              textAlign: 'left',
                              cursor: 'pointer',
                              textDecoration: 'underline'
                            }}
                          >
                            Withdraw application
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
