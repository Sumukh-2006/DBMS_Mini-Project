'use client';

import React, { useEffect, useState } from 'react';
import PageHeader from '../../../components/PageHeader';
import EmptyState from '../../../components/EmptyState';
import {
  IconCalendarEvent,
  IconClock,
  IconVideo,
  IconAlertTriangle,
  IconUsers,
} from '@tabler/icons-react';

export default function StudentInterviewsPage() {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/student/interviews')
      .then((res) => res.json())
      .then((data) => {
        setInterviews(data.interviews || []);
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
        eyebrow="Calendar & Diagnostics • Clash Detection"
        title="Interview Schedule"
        subtitle="Scheduled technical rounds, recruiter panel assignments, and clash warning diagnostics"
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
            }}
          >
            {interviews.length} {interviews.length === 1 ? 'Interview' : 'Interviews'} Scheduled
          </div>
        }
      />

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {[1, 2].map((i) => (
            <div key={i} style={{ height: '160px', background: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }} />
          ))}
        </div>
      ) : interviews.length === 0 ? (
        <EmptyState
          icon={<IconCalendarEvent size={28} />}
          title="No interviews currently scheduled"
          description="When recruiters shortlist your application and allocate panel slots, meeting times will appear here."
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {interviews.map((int) => (
            <div
              key={int.interview_id}
              className="card"
              style={{
                padding: '24px 28px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: '24px',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ flex: 1, minWidth: '320px' }}>
                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono), monospace',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '3px 10px',
                      borderRadius: '999px',
                      backgroundColor: 'var(--ink)',
                      color: '#ffffff',
                    }}
                  >
                    ROUND {int.round_no}
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono), monospace',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '3px 10px',
                      borderRadius: '999px',
                      backgroundColor: 'var(--surface-subtle)',
                      border: '1px solid var(--border)',
                      color: 'var(--ink)',
                    }}
                  >
                    {int.company_name}
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono), monospace',
                      fontSize: '0.7rem',
                      padding: '3px 9px',
                      borderRadius: '999px',
                      backgroundColor: 'rgba(59, 107, 143, 0.08)',
                      color: 'var(--accent-secondary)',
                      textTransform: 'uppercase',
                    }}
                  >
                    {int.mode}
                  </span>

                  {int.has_clash && (
                    <span
                      style={{
                        fontFamily: 'var(--font-mono), monospace',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        padding: '3px 10px',
                        borderRadius: '999px',
                        backgroundColor: 'rgba(217, 45, 32, 0.08)',
                        color: 'var(--accent)',
                        border: '1px solid rgba(217, 45, 32, 0.25)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <IconAlertTriangle size={13} /> Slot Conflict Detected
                    </span>
                  )}
                </div>

                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--ink)', margin: 0 }}>
                  {int.posting_title}
                </h2>

                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '24px',
                    marginTop: '16px',
                    padding: '14px 16px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--surface-subtle)',
                    border: '1px solid var(--border)',
                    fontFamily: 'var(--font-mono), monospace',
                    fontSize: '0.76rem',
                  }}
                >
                  <div>
                    <span style={{ color: 'var(--ink-muted)' }}>Date & Time: </span>
                    <strong style={{ color: 'var(--ink)' }}>{new Date(int.scheduled_at).toLocaleString()}</strong>
                  </div>

                  <div>
                    <span style={{ color: 'var(--ink-muted)' }}>Duration: </span>
                    <strong style={{ color: 'var(--ink)' }}>{int.duration_min} Mins</strong>
                  </div>

                  <div>
                    <span style={{ color: 'var(--ink-muted)' }}>Status: </span>
                    <strong style={{ color: 'var(--accent-secondary)', textTransform: 'uppercase' }}>{int.status}</strong>
                  </div>
                </div>

                {int.panelists?.length > 0 && (
                  <div
                    style={{
                      marginTop: '12px',
                      fontFamily: 'var(--font-mono), monospace',
                      fontSize: '0.74rem',
                      color: 'var(--ink-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <IconUsers size={14} /> Panelists: {int.panelists.map((p) => p.designation).join(', ')}
                  </div>
                )}
              </div>

              <div>
                {int.link_or_room && (
                  <a
                    href={int.link_or_room}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-primary"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <IconVideo size={16} /> Join Interview Room
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
