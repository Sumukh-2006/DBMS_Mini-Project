'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import PageHeader from '../../components/PageHeader';
import StatCard from '../../components/StatCard';
import StatusBadge from '../../components/StatusBadge';
import {
  IconFileText,
  IconChecklist,
  IconCalendarEvent,
  IconTrophy,
  IconArrowRight,
  IconAlertCircle,
  IconClock,
  IconBell,
  IconVideo,
} from '@tabler/icons-react';

export default function StudentDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/student/dashboard')
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ height: '70px', background: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} style={{ height: '110px', background: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }} />
          ))}
        </div>
      </div>
    );
  }

  const {
    student,
    stages,
    activeCount = 0,
    isPlaced = false,
    placedOffer = null,
    nextInterview = null,
    pendingOffers = [],
    upcomingDeadlines = [],
    notifications = [],
  } = data || {};

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Editorial Page Header */}
      <PageHeader
        eyebrow="Student Portal • Level 3 Placement Engine"
        title={student?.full_name ? `Welcome back, ${student.full_name}` : 'Student Dashboard'}
        subtitle={
          student
            ? `PES University Drive • USN: ${student.usn} • Dept: ${student.dept_code || 'CS'} • CGPA: ${student.cgpa}`
            : 'Track applications, interviews, and verified offers'
        }
        action={
          isPlaced ? (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '999px',
                backgroundColor: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                color: '#047857',
                fontFamily: 'var(--font-mono), monospace',
                fontSize: '0.76rem',
                fontWeight: 600,
              }}
            >
              <span className="indicator-dot-green" />
              <span>Placed @ {placedOffer?.company_name} (₹{parseFloat(placedOffer?.stipend || 0).toLocaleString()}/mo)</span>
            </div>
          ) : (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '999px',
                backgroundColor: 'var(--surface-subtle)',
                border: '1px solid var(--border)',
                color: 'var(--ink-muted)',
                fontFamily: 'var(--font-mono), monospace',
                fontSize: '0.76rem',
                fontWeight: 600,
              }}
            >
              <span className="indicator-dot" />
              <span>Active Job Seeker • {activeCount} Active</span>
            </div>
          )
        }
      />

      {/* Urgent Action Alerts: Pending Offers */}
      {pendingOffers?.length > 0 && (
        <div
          style={{
            backgroundColor: '#fff',
            border: '1px solid #fecdd3',
            borderLeft: '4px solid #e11d48',
            borderRadius: 'var(--radius-lg)',
            padding: '20px 24px',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '16px',
            boxShadow: '0 4px 16px rgba(225, 29, 72, 0.06)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: 'rgba(225, 29, 72, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#e11d48',
                flexShrink: 0,
              }}
            >
              <IconAlertCircle size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.98rem', color: 'var(--ink)' }}>
                Action Required: {pendingOffers.length} Pending Placement Offer
                {pendingOffers.length > 1 ? 's' : ''}
              </div>
              <div style={{ fontSize: '0.84rem', color: 'var(--ink-muted)', marginTop: '4px', lineHeight: 1.4 }}>
                From {pendingOffers.map((o) => `${o.company_name} (₹${parseFloat(o.stipend).toLocaleString()}/mo)`).join(', ')}.
                Expires {new Date(pendingOffers[0].expires_at).toLocaleDateString()}.
              </div>
            </div>
          </div>
          <Link
            href="/student/offers"
            className="btn btn-primary"
            style={{ backgroundColor: '#e11d48', borderColor: '#e11d48' }}
          >
            Review Offer <IconArrowRight size={14} />
          </Link>
        </div>
      )}

      {/* Urgent Action Alerts: Next Interview */}
      {nextInterview && (
        <div
          style={{
            backgroundColor: '#fff',
            border: '1px solid #fde68a',
            borderLeft: '4px solid #d97706',
            borderRadius: 'var(--radius-lg)',
            padding: '20px 24px',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '16px',
            boxShadow: '0 4px 16px rgba(217, 119, 6, 0.06)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: 'rgba(217, 119, 6, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#d97706',
                flexShrink: 0,
              }}
            >
              <IconCalendarEvent size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.98rem', color: 'var(--ink)' }}>
                Upcoming Interview: Round {nextInterview.round_no} with {nextInterview.company_name}
              </div>
              <div style={{ fontSize: '0.84rem', color: 'var(--ink-muted)', marginTop: '4px' }}>
                {nextInterview.posting_title} • Scheduled for {new Date(nextInterview.scheduled_at).toLocaleString()} ({nextInterview.duration_min} mins)
              </div>
            </div>
          </div>
          <a
            href={nextInterview.link_or_room}
            target="_blank"
            rel="noreferrer"
            className="btn btn-secondary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <IconVideo size={14} /> Join Meeting Room
          </a>
        </div>
      )}

      {/* KPI Metrics Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
        }}
      >
        <StatCard
          label="Active Applications"
          value={activeCount}
          caption="Max 5 active policy"
          icon={<IconFileText size={18} />}
        />
        <StatCard
          label="Shortlisted"
          value={stages?.Shortlisted || 0}
          caption="Initial screening cleared"
          icon={<IconChecklist size={18} />}
        />
        <StatCard
          label="In Interview"
          value={stages?.Interview || 0}
          caption="Technical & HR rounds"
          icon={<IconCalendarEvent size={18} />}
        />
        <StatCard
          label="Offers Received"
          value={(stages?.Offered || 0) + (stages?.Accepted || 0)}
          caption={`Accepted: ${stages?.Accepted || 0}`}
          icon={<IconTrophy size={18} />}
        />
      </div>

      {/* Two Column Layout: Deadlines Closing Soon & Notifications */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '24px',
        }}
      >
        {/* Deadlines Closing Soon */}
        <div className="card" style={{ padding: '24px' }}>
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <IconClock size={16} color="var(--ink-muted)" />
              <h2 style={{ fontSize: '0.98rem', fontWeight: 700, margin: 0, color: 'var(--ink)' }}>
                Application Deadlines
              </h2>
            </div>
            <Link
              href="/student/browse"
              style={{
                fontFamily: 'var(--font-mono), monospace',
                fontSize: '0.72rem',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                fontWeight: 600,
                color: 'var(--ink)',
              }}
            >
              Browse All →
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {upcomingDeadlines?.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--ink-muted)', fontSize: '0.85rem' }}>
                No immediate deadlines in the next 7 days.
              </div>
            ) : (
              upcomingDeadlines.map((d) => (
                <div
                  key={d.posting_id}
                  style={{
                    padding: '14px 16px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--surface-subtle)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '12px',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--ink)' }}>{d.title}</div>
                    <div
                      style={{
                        fontFamily: 'var(--font-mono), monospace',
                        fontSize: '0.74rem',
                        color: 'var(--ink-muted)',
                        marginTop: '3px',
                      }}
                    >
                      {d.company_name} • {d.location} • ₹{parseFloat(d.stipend).toLocaleString()}/mo
                    </div>
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--font-mono), monospace',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '4px 8px',
                      borderRadius: '999px',
                      backgroundColor: 'rgba(217, 45, 32, 0.08)',
                      color: 'var(--accent)',
                      border: '1px solid rgba(217, 45, 32, 0.2)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {d.days_remaining}d remaining
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* MongoDB Activity Notifications Stream */}
        <div className="card" style={{ padding: '24px' }}>
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <IconBell size={16} color="var(--ink-muted)" />
              <h2 style={{ fontSize: '0.98rem', fontWeight: 700, margin: 0, color: 'var(--ink)' }}>
                Activity Stream (MongoDB)
              </h2>
            </div>
            <span
              style={{
                fontFamily: 'var(--font-mono), monospace',
                fontSize: '0.68rem',
                textTransform: 'uppercase',
                color: 'var(--ink-muted)',
              }}
            >
              Live Feed
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {notifications?.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--ink-muted)', fontSize: '0.85rem' }}>
                No system notifications.
              </div>
            ) : (
              notifications.map((n, i) => (
                <div
                  key={i}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border)',
                    backgroundColor: '#ffffff',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '8px' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.86rem', color: 'var(--ink)' }}>{n.title}</span>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono), monospace',
                        fontSize: '0.68rem',
                        color: 'var(--ink-muted)',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {new Date(n.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--ink-muted)', marginTop: '3px', lineHeight: 1.4 }}>
                    {n.message}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
