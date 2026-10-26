'use client';
// app/recruiter/page.js - Recruiter Dashboard
import React, { useEffect, useState } from 'react';
import Link from 'next/link';

export default function RecruiterDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/recruiter/dashboard')
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
    return <div style={{ color: 'var(--text-secondary)' }}>Loading recruiter analytics...</div>;
  }

  const { recruiter, postingsSummary, applicantsSummary, upcomingInterviews } = data;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Recruitment Dashboard</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
            Hiring operations for {recruiter?.company_name} • University Campus Hiring Drive
          </p>
        </div>

        <Link href="/recruiter/postings/create" className="btn btn-primary" style={{ background: 'linear-gradient(135deg, #ec4899, #be185d)' }}>
          + Create New Posting
        </Link>
      </div>

      {/* Metrics Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px',
        marginBottom: '32px'
      }}>
        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
            Active Postings
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '8px', color: '#ec4899' }}>
            {postingsSummary?.active_postings || 0}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Openings: {postingsSummary?.total_filled || 0} / {postingsSummary?.total_openings || 0} Filled
          </div>
        </div>

        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
            Total Applicants
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '8px', color: '#60a5fa' }}>
            {applicantsSummary?.total_applicants || 0}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            {applicantsSummary?.count_applied || 0} Pending Initial Review
          </div>
        </div>

        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
            Shortlisted & Interviewing
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '8px', color: '#fbbf24' }}>
            {(parseInt(applicantsSummary?.count_shortlisted || 0) + parseInt(applicantsSummary?.count_interview || 0))}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            In Active Pipeline
          </div>
        </div>

        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
            Offers Accepted
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '8px', color: '#34d399' }}>
            {applicantsSummary?.count_accepted || 0}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Pending Offers: {applicantsSummary?.count_offered || 0}
          </div>
        </div>
      </div>

      {/* Upcoming Interviews & Quick Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '24px' }}>
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>📅 Upcoming Candidate Interviews</h2>
            <Link href="/recruiter/interviews" style={{ fontSize: '0.82rem', color: '#ec4899', fontWeight: 600 }}>
              Schedule new →
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {upcomingInterviews?.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No upcoming interviews scheduled.</div>
            ) : (
              upcomingInterviews?.map((int) => (
                <div
                  key={int.interview_id}
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
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#fff' }}>
                      {int.candidate_name} ({int.usn})
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      Round {int.round_no} • {int.posting_title}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#fbbf24', marginTop: '4px' }}>
                      {new Date(int.scheduled_at).toLocaleString()} ({int.duration_min}m)
                    </div>
                  </div>

                  <a href={int.link_or_room} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">
                    Open Meet →
                  </a>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Review Shortcuts */}
        <div className="glass-card">
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px' }}>
            ⚡ Quick Pipeline Actions
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <Link
              href="/recruiter/applicants"
              className="glass-card"
              style={{
                padding: '16px',
                background: 'rgba(255, 255, 255, 0.02)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>Review Ranked Applicants</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  View candidates ordered by pgvector similarity and skill match
                </div>
              </div>
              <span style={{ fontSize: '1.2rem' }}>👥 →</span>
            </Link>

            <Link
              href="/recruiter/analytics"
              className="glass-card"
              style={{
                padding: '16px',
                background: 'rgba(255, 255, 255, 0.02)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>Conversion Funnel Analytics</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Inspect stage drop-off and offer acceptance rates
                </div>
              </div>
              <span style={{ fontSize: '1.2rem' }}>📈 →</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
