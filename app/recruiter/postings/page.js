'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import PageHeader from '../../../components/PageHeader';
import EmptyState from '../../../components/EmptyState';
import {
  IconBriefcase,
  IconPlus,
  IconMapPin,
  IconUsers,
  IconClock,
  IconChartBar,
  IconArrowRight,
} from '@tabler/icons-react';

export default function RecruiterPostingsPage() {
  const [postings, setPostings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/recruiter/postings')
      .then((res) => res.json())
      .then((data) => {
        setPostings(data.postings || []);
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
        eyebrow="Company Roles • Pipeline Management"
        title="Company Postings"
        subtitle="Manage active role postings, track applicants, and review conversion funnels"
        action={
          <Link
            href="/recruiter/postings/create"
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <IconPlus size={16} /> Create New Role
          </Link>
        }
      />

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {[1, 2].map((i) => (
            <div key={i} style={{ height: '140px', background: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }} />
          ))}
        </div>
      ) : postings.length === 0 ? (
        <EmptyState
          icon={<IconBriefcase size={28} />}
          title="No postings created yet"
          description="Create your company's first internship posting to begin receiving ranked student applications."
          action={
            <Link href="/recruiter/postings/create" className="btn btn-primary btn-sm">
              Create First Posting
            </Link>
          }
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {postings.map((p) => (
            <div
              key={p.posting_id}
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
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      padding: '3px 10px',
                      borderRadius: '999px',
                      backgroundColor: 'rgba(59, 107, 143, 0.08)',
                      color: 'var(--accent-secondary)',
                      textTransform: 'uppercase',
                    }}
                  >
                    {p.mode}
                  </span>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '0.78rem',
                      color: 'var(--ink-muted)',
                    }}
                  >
                    <IconMapPin size={13} /> {p.location}
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono), monospace',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      padding: '3px 10px',
                      borderRadius: '999px',
                      backgroundColor: p.status === 'open' ? 'rgba(16, 185, 129, 0.08)' : 'var(--surface-subtle)',
                      color: p.status === 'open' ? '#047857' : 'var(--ink-muted)',
                      border: `1px solid ${p.status === 'open' ? 'rgba(16, 185, 129, 0.25)' : 'var(--border)'}`,
                    }}
                  >
                    {p.status.toUpperCase()}
                  </span>
                </div>

                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--ink)', margin: 0 }}>
                  {p.title}
                </h2>

                <p
                  style={{
                    fontSize: '0.86rem',
                    color: 'var(--ink-muted)',
                    marginTop: '8px',
                    lineHeight: 1.5,
                    maxWidth: '720px',
                  }}
                >
                  {p.description.slice(0, 220)}...
                </p>

                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '20px',
                    marginTop: '16px',
                    fontFamily: 'var(--font-mono), monospace',
                    fontSize: '0.76rem',
                    color: 'var(--ink-muted)',
                  }}
                >
                  <div>
                    Stipend:{' '}
                    <strong style={{ color: 'var(--ink)' }}>₹{parseFloat(p.stipend).toLocaleString()}/mo</strong>
                  </div>
                  <div>
                    Openings:{' '}
                    <strong style={{ color: 'var(--ink)' }}>{p.filled} / {p.openings} Filled</strong>
                  </div>
                  <div>
                    Min CGPA: <strong style={{ color: 'var(--ink)' }}>{p.min_cgpa}</strong>
                  </div>
                  <div>
                    Deadline: <strong style={{ color: 'var(--ink)' }}>{new Date(p.deadline).toLocaleDateString()}</strong>
                  </div>
                </div>
              </div>

              <div
                style={{
                  minWidth: '200px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'stretch',
                  gap: '8px',
                }}
              >
                <div
                  style={{
                    backgroundColor: 'var(--surface-subtle)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    padding: '12px 16px',
                    textAlign: 'center',
                  }}
                >
                  <div
                    style={{
                      fontFamily: 'var(--font-mono), monospace',
                      fontSize: '1.4rem',
                      fontWeight: 700,
                      color: 'var(--ink)',
                      lineHeight: 1,
                    }}
                  >
                    {p.total_applicants}
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--font-mono), monospace',
                      fontSize: '0.66rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      color: 'var(--ink-muted)',
                      marginTop: '4px',
                    }}
                  >
                    Total Applicants
                  </div>
                </div>

                <Link
                  href={`/recruiter/applicants?postingId=${p.posting_id}`}
                  className="btn btn-primary btn-sm"
                  style={{ justifyContent: 'center', marginTop: '4px' }}
                >
                  View Applicants <IconArrowRight size={14} />
                </Link>

                <Link
                  href={`/recruiter/analytics?postingId=${p.posting_id}`}
                  className="btn btn-secondary btn-sm"
                  style={{ justifyContent: 'center', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                >
                  <IconChartBar size={14} /> Funnel Analytics
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
