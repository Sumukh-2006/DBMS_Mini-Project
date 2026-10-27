'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import PageHeader from '../../components/PageHeader';
import StatCard from '../../components/StatCard';
import {
  IconBriefcase,
  IconUsers,
  IconCalendarEvent,
  IconTrophy,
  IconPlus,
  IconVideo,
  IconArrowRight,
  IconChartBar,
} from '@tabler/icons-react';

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

  const { recruiter, postingsSummary, applicantsSummary, upcomingInterviews = [] } = data || {};

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      <PageHeader
        eyebrow="Recruiter Console • Campus Placement Drive"
        title="Recruitment Operations"
        subtitle={`Enterprise hiring portal for ${recruiter?.company_name || 'Employer Partner'} • PES University Drive`}
        action={
          <Link
            href="/recruiter/postings/create"
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <IconPlus size={16} /> Create Role Posting
          </Link>
        }
      />

      {/* KPI Metrics Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
        }}
      >
        <StatCard
          label="Active Postings"
          value={postingsSummary?.active_postings || 0}
          caption={`Openings: ${postingsSummary?.total_filled || 0} / ${postingsSummary?.total_openings || 0} filled`}
          icon={<IconBriefcase size={18} />}
        />
        <StatCard
          label="Total Applicants"
          value={applicantsSummary?.total_applicants || 0}
          caption={`${applicantsSummary?.count_applied || 0} pending initial review`}
          icon={<IconUsers size={18} />}
        />
        <StatCard
          label="Active Pipeline"
          value={parseInt(applicantsSummary?.count_shortlisted || 0) + parseInt(applicantsSummary?.count_interview || 0)}
          caption="Shortlisted & interview rounds"
          icon={<IconCalendarEvent size={18} />}
        />
        <StatCard
          label="Offers Accepted"
          value={applicantsSummary?.count_accepted || 0}
          caption={`Pending offers: ${applicantsSummary?.count_offered || 0}`}
          icon={<IconTrophy size={18} />}
        />
      </div>

      {/* Upcoming Candidate Interviews & Quick Actions */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '24px',
        }}
      >
        {/* Upcoming Candidate Interviews */}
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
              <IconCalendarEvent size={16} color="var(--ink-muted)" />
              <h2 style={{ fontSize: '0.98rem', fontWeight: 700, margin: 0, color: 'var(--ink)' }}>
                Upcoming Candidate Interviews
              </h2>
            </div>
            <Link
              href="/recruiter/interviews"
              style={{
                fontFamily: 'var(--font-mono), monospace',
                fontSize: '0.72rem',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                fontWeight: 600,
                color: 'var(--ink)',
              }}
            >
              Schedule New →
            </Link>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {upcomingInterviews?.length === 0 ? (
              <div style={{ padding: '28px', textAlign: 'center', color: 'var(--ink-muted)', fontSize: '0.85rem' }}>
                No interviews scheduled for today.
              </div>
            ) : (
              upcomingInterviews.map((int) => (
                <div
                  key={int.interview_id}
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
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--ink)' }}>
                      {int.candidate_name}{' '}
                      <span style={{ fontFamily: 'var(--font-mono), monospace', fontSize: '0.75rem', color: 'var(--ink-muted)' }}>
                        ({int.usn})
                      </span>
                    </div>
                    <div
                      style={{
                        fontFamily: 'var(--font-mono), monospace',
                        fontSize: '0.74rem',
                        color: 'var(--ink-muted)',
                        marginTop: '3px',
                      }}
                    >
                      Round {int.round_no} • {int.posting_title}
                    </div>
                    <div
                      style={{
                        fontFamily: 'var(--font-mono), monospace',
                        fontSize: '0.72rem',
                        color: '#b45309',
                        marginTop: '4px',
                      }}
                    >
                      {new Date(int.scheduled_at).toLocaleString()} ({int.duration_min}m)
                    </div>
                  </div>

                  <a
                    href={int.link_or_room}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-secondary btn-sm"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}
                  >
                    <IconVideo size={13} /> Open Meet
                  </a>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Review Shortcuts */}
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
            <h2 style={{ fontSize: '0.98rem', fontWeight: 700, margin: 0, color: 'var(--ink)' }}>
              Quick Pipeline Workflows
            </h2>
            <span
              style={{
                fontFamily: 'var(--font-mono), monospace',
                fontSize: '0.68rem',
                textTransform: 'uppercase',
                color: 'var(--ink-muted)',
              }}
            >
              Shortcuts
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <Link
              href="/recruiter/applicants"
              className="card"
              style={{
                padding: '16px 18px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: 'var(--surface-subtle)',
                transition: 'all 0.16s ease',
              }}
            >
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--ink)' }}>
                  Review Ranked Applicants
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--ink-muted)', marginTop: '3px' }}>
                  Candidates ranked by pgvector cosine similarity & skill overlap
                </div>
              </div>
              <IconArrowRight size={16} color="var(--ink)" />
            </Link>

            <Link
              href="/recruiter/analytics"
              className="card"
              style={{
                padding: '16px 18px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: 'var(--surface-subtle)',
                transition: 'all 0.16s ease',
              }}
            >
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--ink)' }}>
                  Conversion Funnel Analytics
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--ink-muted)', marginTop: '3px' }}>
                  Inspect stage conversion rates backed by PostgreSQL view v_posting_funnel
                </div>
              </div>
              <IconChartBar size={16} color="var(--ink)" />
            </Link>

            <Link
              href="/recruiter/postings"
              className="card"
              style={{
                padding: '16px 18px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: 'var(--surface-subtle)',
                transition: 'all 0.16s ease',
              }}
            >
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--ink)' }}>
                  Manage Active Role Postings
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--ink-muted)', marginTop: '3px' }}>
                  Monitor openings, deadlines, and applicant counts across active roles
                </div>
              </div>
              <IconBriefcase size={16} color="var(--ink)" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
