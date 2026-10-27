'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import PageHeader from '../../../components/PageHeader';
import {
  IconCheck,
  IconAlertCircle,
  IconCalendarEvent,
  IconArrowRight,
  IconClock,
} from '@tabler/icons-react';

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

      const res = await fetch('/api/recruiter/applications/bulk-stage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationIds: [applicationId],
          newStage: 'Withdrawn',
          reason: 'Student initiated withdrawal from portal',
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to withdraw');

      setMessage('Application withdrawn successfully and recorded in audit history.');
      fetchPipeline();
    } catch (err) {
      setError(err.message);
    } finally {
      setWithdrawingId(null);
    }
  };

  const columns = [
    { key: 'Applied', title: 'Applied', dotColor: '#3b6b8f' },
    { key: 'Shortlisted', title: 'Shortlisted', dotColor: '#6366f1' },
    { key: 'Interview', title: 'Interview', dotColor: '#d97706' },
    { key: 'Offered', title: 'Offered', dotColor: '#e11d48' },
    { key: 'Accepted', title: 'Accepted', dotColor: '#059669' },
    { key: 'Rejected', title: 'Rejected', dotColor: '#dc2626' },
    { key: 'Withdrawn', title: 'Withdrawn', dotColor: '#9ca3af' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      <PageHeader
        eyebrow="Workflow Engine • PostgreSQL Triggers & Views"
        title="Application Pipeline Board"
        subtitle="Interactive Kanban workflow tracking stages backed by PostgreSQL views and triggers"
      />

      {message && (
        <div
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #bbf7d0',
            borderLeft: '4px solid #16a34a',
            padding: '14px 18px',
            borderRadius: 'var(--radius-md)',
            color: '#15803d',
            fontSize: '0.88rem',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <IconCheck size={18} />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #fecdd3',
            borderLeft: '4px solid #e11d48',
            padding: '14px 18px',
            borderRadius: 'var(--radius-md)',
            color: '#be123c',
            fontSize: '0.88rem',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <IconAlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} style={{ height: '320px', background: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }} />
          ))}
        </div>
      ) : (
        <div
          style={{
            display: 'flex',
            gap: '14px',
            overflowX: 'auto',
            paddingBottom: '20px',
            alignItems: 'flex-start',
          }}
        >
          {columns.map((col) => {
            const cards = kanban?.[col.key] || [];
            return (
              <div
                key={col.key}
                style={{
                  minWidth: '260px',
                  maxWidth: '260px',
                  backgroundColor: 'var(--surface-subtle)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                {/* Column Header */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingBottom: '10px',
                    borderBottom: '1px solid var(--border)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: col.dotColor,
                      }}
                    />
                    <span
                      style={{
                        fontFamily: 'var(--font-mono), monospace',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        color: 'var(--ink)',
                      }}
                    >
                      {col.title}
                    </span>
                  </div>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono), monospace',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      backgroundColor: '#ffffff',
                      border: '1px solid var(--border)',
                      borderRadius: '999px',
                      padding: '2px 8px',
                      color: 'var(--ink-muted)',
                    }}
                  >
                    {cards.length}
                  </span>
                </div>

                {/* Cards List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', minHeight: '220px' }}>
                  {cards.length === 0 ? (
                    <div
                      style={{
                        textAlign: 'center',
                        padding: '36px 12px',
                        color: 'var(--ink-muted)',
                        fontSize: '0.76rem',
                        fontFamily: 'var(--font-mono), monospace',
                        border: '1px dashed var(--border)',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: '#ffffff',
                      }}
                    >
                      No applications
                    </div>
                  ) : (
                    cards.map((app) => (
                      <div
                        key={app.application_id}
                        className="card"
                        style={{
                          padding: '14px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '6px' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.86rem', color: 'var(--ink)' }}>
                            {app.company_name}
                          </span>
                          <span
                            style={{
                              fontFamily: 'var(--font-mono), monospace',
                              fontSize: '0.66rem',
                              fontWeight: 700,
                              padding: '2px 6px',
                              borderRadius: '999px',
                              backgroundColor: 'var(--surface-subtle)',
                              border: '1px solid var(--border)',
                              color: 'var(--ink)',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {Math.round(app.match_score)}%
                          </span>
                        </div>

                        <div style={{ fontSize: '0.8rem', color: 'var(--ink-muted)', lineHeight: 1.3 }}>
                          {app.posting_title}
                        </div>

                        <div
                          style={{
                            fontFamily: 'var(--font-mono), monospace',
                            fontSize: '0.72rem',
                            color: 'var(--ink-muted)',
                            marginTop: '2px',
                          }}
                        >
                          ₹{parseFloat(app.stipend).toLocaleString()}/mo
                        </div>

                        {/* Interview Snippet */}
                        {app.next_interview && (
                          <div
                            style={{
                              fontSize: '0.72rem',
                              fontFamily: 'var(--font-mono), monospace',
                              backgroundColor: 'rgba(217, 119, 6, 0.08)',
                              border: '1px solid rgba(217, 119, 6, 0.25)',
                              color: '#b45309',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              marginTop: '4px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <IconCalendarEvent size={12} />
                            <span>R{app.next_interview.round_no}: {new Date(app.next_interview.scheduled_at).toLocaleDateString()}</span>
                          </div>
                        )}

                        {/* Offer link */}
                        {col.key === 'Offered' && (
                          <Link
                            href="/student/offers"
                            className="btn btn-primary btn-sm"
                            style={{
                              marginTop: '6px',
                              fontSize: '0.72rem',
                              padding: '4px 10px',
                              justifyContent: 'center',
                            }}
                          >
                            View Offer <IconArrowRight size={12} />
                          </Link>
                        )}

                        {/* Withdraw button for active stages */}
                        {!['Accepted', 'Rejected', 'Withdrawn'].includes(col.key) && (
                          <button
                            onClick={() => handleWithdraw(app.application_id)}
                            disabled={withdrawingId === app.application_id}
                            style={{
                              marginTop: '4px',
                              background: 'transparent',
                              border: 'none',
                              color: 'var(--ink-muted)',
                              fontSize: '0.7rem',
                              fontFamily: 'var(--font-mono), monospace',
                              textAlign: 'left',
                              cursor: 'pointer',
                              textDecoration: 'underline',
                              padding: 0,
                            }}
                          >
                            {withdrawingId === app.application_id ? 'Withdrawing...' : 'Withdraw application'}
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
