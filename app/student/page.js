'use client';
// app/student/page.js - Student Dashboard
import React, { useEffect, useState } from 'react';
import Link from 'next/link';

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
    return <div style={{ color: 'var(--text-secondary)' }}>Loading student metrics...</div>;
  }

  const { student, stages, activeCount, isPlaced, placedOffer, nextInterview, pendingOffers, upcomingDeadlines, notifications } = data;

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Welcome back, {student?.full_name}! 👋</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
            PES University Placement Drive • {student?.usn}
          </p>
        </div>

        {isPlaced ? (
          <div className="badge badge-accepted" style={{ fontSize: '0.9rem', padding: '8px 16px' }}>
            🎉 Placed at {placedOffer?.company_name} (₹{parseFloat(placedOffer?.stipend).toLocaleString()}/mo)
          </div>
        ) : (
          <div className="badge badge-applied" style={{ fontSize: '0.9rem', padding: '8px 16px' }}>
            Active Job Seeker • {activeCount} Active Applications
          </div>
        )}
      </div>

      {/* Urgent Action Alerts */}
      {pendingOffers?.length > 0 && (
        <div style={{
          background: 'rgba(236, 72, 153, 0.12)',
          border: '1px solid rgba(236, 72, 153, 0.4)',
          borderRadius: 'var(--radius-lg)',
          padding: '20px',
          marginBottom: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#f472b6', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🎁</span> You have {pendingOffers.length} pending internship offer requiring your response!
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              From {pendingOffers.map(o => `${o.company_name} (₹${parseFloat(o.stipend).toLocaleString()}/mo)`).join(', ')}.
              Expires on {new Date(pendingOffers[0].expires_at).toLocaleDateString()}.
            </div>
          </div>
          <Link href="/student/offers" className="btn btn-primary" style={{ background: '#ec4899' }}>
            Review Offers →
          </Link>
        </div>
      )}

      {nextInterview && (
        <div style={{
          background: 'rgba(245, 158, 11, 0.1)',
          border: '1px solid rgba(245, 158, 11, 0.4)',
          borderRadius: 'var(--radius-lg)',
          padding: '20px',
          marginBottom: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>📅</span> Next Interview: Round {nextInterview.round_no} with {nextInterview.company_name}
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              {nextInterview.posting_title} • Scheduled for {new Date(nextInterview.scheduled_at).toLocaleString()} ({nextInterview.duration_min} mins)
            </div>
          </div>
          <a href={nextInterview.link_or_room} target="_blank" rel="noreferrer" className="btn btn-secondary">
            Join Interview Room →
          </a>
        </div>
      )}

      {/* Metrics Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px',
        marginBottom: '32px'
      }}>
        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
            Active Applications
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '8px', color: '#60a5fa' }}>
            {activeCount}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Limit: 5 active per policy
          </div>
        </div>

        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
            Shortlisted
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '8px', color: '#c084fc' }}>
            {stages?.Shortlisted || 0}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Passed initial screening
          </div>
        </div>

        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
            In Interview
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '8px', color: '#fbbf24' }}>
            {stages?.Interview || 0}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Technical & HR rounds
          </div>
        </div>

        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
            Offers Received
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '8px', color: '#34d399' }}>
            {(stages?.Offered || 0) + (stages?.Accepted || 0)}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Accepted: {stages?.Accepted || 0}
          </div>
        </div>
      </div>

      {/* Two Column Layout: Upcoming Deadlines & Notifications */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
        {/* Deadlines Closing Soon */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>⏳ Deadlines Closing Soon</h2>
            <Link href="/student/browse" style={{ fontSize: '0.82rem', color: 'var(--accent-primary)', fontWeight: 600 }}>
              Browse all →
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {upcomingDeadlines?.map((d) => (
              <div
                key={d.posting_id}
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: '14px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{d.title}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {d.company_name} • {d.location} • ₹{parseFloat(d.stipend).toLocaleString()}/mo
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="badge badge-rejected" style={{ fontSize: '0.72rem' }}>
                    {d.days_remaining} days left
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* MongoDB Activity Notifications Stream */}
        <div className="glass-card">
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px' }}>
            🔔 System Notifications (MongoDB)
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {notifications?.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No new notifications.</div>
            ) : (
              notifications?.map((n, i) => (
                <div
                  key={i}
                  style={{
                    padding: '12px',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-color)',
                    fontSize: '0.85rem'
                  }}
                >
                  <div style={{ fontWeight: 600, color: '#f3f4f6' }}>{n.title}</div>
                  <div style={{ color: 'var(--text-secondary)', marginTop: '2px', fontSize: '0.8rem' }}>
                    {n.message}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                    {new Date(n.created_at).toLocaleString()}
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
