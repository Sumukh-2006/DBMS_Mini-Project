'use client';

import React, { useEffect, useState } from 'react';
import PageHeader from '../../../components/PageHeader';
import StatusBadge from '../../../components/StatusBadge';
import EmptyState from '../../../components/EmptyState';
import {
  IconSearch,
  IconMapPin,
  IconBriefcase,
  IconCurrencyRupee,
  IconCheck,
  IconAlertCircle,
  IconClock,
  IconUsers,
} from '@tabler/icons-react';

export default function BrowsePostingsPage() {
  const [postings, setPostings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [mode, setMode] = useState('');
  const [minStipend, setMinStipend] = useState('');
  const [sort, setSort] = useState('deadline_asc');
  const [applyingId, setApplyingId] = useState(null);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const fetchPostings = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.append('q', search);
    if (mode) params.append('mode', mode);
    if (minStipend) params.append('minStipend', minStipend);
    if (sort) params.append('sort', sort);

    fetch(`/api/student/postings?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        setPostings(data.postings || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPostings();
    }, 250);
    return () => clearTimeout(timer);
  }, [search, mode, minStipend, sort]);

  const handleApply = async (postingId) => {
    try {
      setApplyingId(postingId);
      setMessage(null);
      setError(null);

      const res = await fetch('/api/student/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postingId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to apply');

      setMessage(data.message);
      fetchPostings();
    } catch (err) {
      setError(err.message);
    } finally {
      setApplyingId(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      <PageHeader
        eyebrow="Placement Drive • Verified Openings"
        title="Browse Internship Postings"
        subtitle="Search roles across top companies with full-text search and real-time eligibility checks"
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
            {postings.length} {postings.length === 1 ? 'Role' : 'Roles'} Available
          </div>
        }
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

      {/* Search and Filters Bar */}
      <div className="card" style={{ padding: '20px' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '14px',
          }}
        >
          <div style={{ gridColumn: 'span 2' }}>
            <label className="form-label">Full-Text Search (tsvector)</label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="form-input"
                style={{ width: '100%', paddingLeft: '36px' }}
                placeholder="Search title, keywords (e.g. distributed, cloud, react)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <span
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--ink-muted)',
                  display: 'flex',
                }}
              >
                <IconSearch size={16} />
              </span>
            </div>
          </div>

          <div>
            <label className="form-label">Work Mode</label>
            <select className="form-select" style={{ width: '100%' }} value={mode} onChange={(e) => setMode(e.target.value)}>
              <option value="">All Modes</option>
              <option value="hybrid">Hybrid</option>
              <option value="remote">Remote</option>
              <option value="on-site">On-Site</option>
            </select>
          </div>

          <div>
            <label className="form-label">Min Stipend</label>
            <select className="form-select" style={{ width: '100%' }} value={minStipend} onChange={(e) => setMinStipend(e.target.value)}>
              <option value="">Any Stipend</option>
              <option value="50000">₹50,000+/mo</option>
              <option value="80000">₹80,000+/mo</option>
              <option value="100000">₹1,00,000+/mo</option>
            </select>
          </div>

          <div>
            <label className="form-label">Sort Order</label>
            <select className="form-select" style={{ width: '100%' }} value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="deadline_asc">Closing Soon</option>
              <option value="stipend_desc">Highest Stipend</option>
              <option value="cgpa_asc">Lowest Cutoff CGPA</option>
              <option value="newest">Newest</option>
            </select>
          </div>
        </div>
      </div>

      {/* Postings Stream */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ height: '140px', background: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }} />
          ))}
        </div>
      ) : postings.length === 0 ? (
        <EmptyState
          icon={<IconBriefcase size={28} />}
          title="No postings match your search"
          description="Try broadening your stipend or mode filters, or clear your search keywords."
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {postings.map((p) => {
            const isEligible = p.is_cgpa_eligible && p.is_dept_eligible;
            return (
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
                {/* Left Role Details */}
                <div style={{ flex: 1, minWidth: '300px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                    <span
                      style={{
                        padding: '3px 10px',
                        borderRadius: '999px',
                        backgroundColor: 'var(--surface-subtle)',
                        border: '1px solid var(--border)',
                        fontFamily: 'var(--font-mono), monospace',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        color: 'var(--ink)',
                      }}
                    >
                      {p.company_name}
                    </span>
                    <span
                      style={{
                        padding: '3px 10px',
                        borderRadius: '999px',
                        backgroundColor: 'rgba(59, 107, 143, 0.08)',
                        color: 'var(--accent-secondary)',
                        fontFamily: 'var(--font-mono), monospace',
                        fontSize: '0.7rem',
                        fontWeight: 600,
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
                    {p.description}
                  </p>

                  {/* Skills Pills */}
                  {p.skills?.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '14px' }}>
                      {p.skills.map((sk, idx) => (
                        <span
                          key={idx}
                          style={{
                            fontFamily: 'var(--font-mono), monospace',
                            fontSize: '0.72rem',
                            padding: '3px 9px',
                            borderRadius: '999px',
                            backgroundColor: sk.is_mandatory ? 'var(--surface-subtle)' : '#ffffff',
                            color: sk.is_mandatory ? 'var(--ink)' : 'var(--ink-muted)',
                            border: '1px solid var(--border)',
                            fontWeight: sk.is_mandatory ? 600 : 400,
                          }}
                        >
                          {sk.name} {sk.is_mandatory ? `(Req Lv${sk.min_level})` : '(Pref)'}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right Action & Info Box */}
                <div
                  style={{
                    minWidth: '220px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                    gap: '10px',
                    textAlign: 'right',
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontFamily: 'var(--font-mono), monospace',
                        fontSize: '1.45rem',
                        fontWeight: 700,
                        color: 'var(--ink)',
                      }}
                    >
                      ₹{parseFloat(p.stipend).toLocaleString()}
                      <span style={{ fontSize: '0.76rem', color: 'var(--ink-muted)', fontWeight: 400 }}> /mo</span>
                    </div>
                  </div>

                  <div
                    style={{
                      fontFamily: 'var(--font-mono), monospace',
                      fontSize: '0.74rem',
                      color: 'var(--ink-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}
                  >
                    <IconUsers size={14} /> Openings: {p.filled} / {p.openings}
                  </div>

                  <div
                    style={{
                      fontFamily: 'var(--font-mono), monospace',
                      fontSize: '0.74rem',
                      color: 'var(--ink-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}
                  >
                    <IconClock size={14} /> Deadline: {new Date(p.deadline).toLocaleDateString()}
                  </div>

                  {/* Eligibility Status Pill */}
                  <div style={{ marginTop: '4px' }}>
                    {!p.is_cgpa_eligible ? (
                      <span
                        style={{
                          fontFamily: 'var(--font-mono), monospace',
                          fontSize: '0.7rem',
                          padding: '3px 8px',
                          borderRadius: '999px',
                          backgroundColor: 'rgba(217, 45, 32, 0.08)',
                          color: 'var(--accent)',
                          border: '1px solid rgba(217, 45, 32, 0.2)',
                          fontWeight: 600,
                        }}
                      >
                        CGPA {p.min_cgpa} Required
                      </span>
                    ) : !p.is_dept_eligible ? (
                      <span
                        style={{
                          fontFamily: 'var(--font-mono), monospace',
                          fontSize: '0.7rem',
                          padding: '3px 8px',
                          borderRadius: '999px',
                          backgroundColor: 'rgba(217, 45, 32, 0.08)',
                          color: 'var(--accent)',
                          border: '1px solid rgba(217, 45, 32, 0.2)',
                          fontWeight: 600,
                        }}
                      >
                        Dept Restricted
                      </span>
                    ) : (
                      <span
                        style={{
                          fontFamily: 'var(--font-mono), monospace',
                          fontSize: '0.7rem',
                          padding: '3px 8px',
                          borderRadius: '999px',
                          backgroundColor: 'rgba(16, 185, 129, 0.08)',
                          color: '#047857',
                          border: '1px solid rgba(16, 185, 129, 0.25)',
                          fontWeight: 600,
                        }}
                      >
                        ✓ Eligible (Min {p.min_cgpa})
                      </span>
                    )}
                  </div>

                  {/* Apply Button or Applied Status */}
                  <div style={{ width: '100%', marginTop: '6px' }}>
                    {p.student_stage ? (
                      <div
                        style={{
                          fontFamily: 'var(--font-mono), monospace',
                          fontSize: '0.74rem',
                          fontWeight: 600,
                          padding: '8px 16px',
                          borderRadius: '999px',
                          backgroundColor: 'var(--surface-subtle)',
                          border: '1px solid var(--border)',
                          color: 'var(--ink)',
                          textAlign: 'center',
                        }}
                      >
                        Status: {p.student_stage}
                      </div>
                    ) : (
                      <button
                        onClick={() => handleApply(p.posting_id)}
                        disabled={!isEligible || applyingId === p.posting_id}
                        className="btn btn-primary"
                        style={{
                          width: '100%',
                          opacity: !isEligible ? 0.45 : 1,
                          cursor: !isEligible ? 'not-allowed' : 'pointer',
                        }}
                      >
                        {applyingId === p.posting_id ? 'Submitting...' : 'Apply Now →'}
                      </button>
                    )}
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
