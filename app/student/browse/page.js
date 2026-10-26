'use client';
// app/student/browse/page.js - Browse & Search Postings with Full-Text Search and Filters
import React, { useEffect, useState } from 'react';

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
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Browse Internship Postings</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
          Search roles across top companies with full-text search and real-time eligibility checks
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

      {/* Search and Filters Bar */}
      <div className="glass-card" style={{ padding: '20px', marginBottom: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '14px' }}>
          <div>
            <label className="form-label">Full-Text Search (tsvector)</label>
            <input
              type="text"
              className="form-input"
              style={{ width: '100%' }}
              placeholder="Search title, keywords (e.g. distributed, cloud, react)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
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
            <label className="form-label">Min Stipend (₹/mo)</label>
            <select className="form-select" style={{ width: '100%' }} value={minStipend} onChange={(e) => setMinStipend(e.target.value)}>
              <option value="">Any Stipend</option>
              <option value="50000">₹50,000+</option>
              <option value="80000">₹80,000+</option>
              <option value="100000">₹1,00,000+</option>
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

      {/* Postings Grid */}
      {loading ? (
        <div style={{ color: 'var(--text-secondary)' }}>Searching postings...</div>
      ) : postings.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🔍</div>
          <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>No postings found matching your filters</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>
            Try clearing search keywords or broadening stipend and mode filters.
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {postings.map((p) => {
            const isEligible = p.is_cgpa_eligible && p.is_dept_eligible;
            return (
              <div key={p.posting_id} className="glass-card" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <span className="badge badge-applied">{p.company_name}</span>
                      <span className="badge badge-shortlisted">{p.mode}</span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>📍 {p.location}</span>
                    </div>

                    <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#fff' }}>{p.title}</h2>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '8px', lineHeight: 1.5, maxWidth: '800px' }}>
                      {p.description}
                    </p>

                    {/* Skills pills */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '14px' }}>
                      {p.skills?.map((sk, idx) => (
                        <span
                          key={idx}
                          style={{
                            fontSize: '0.75rem',
                            padding: '3px 8px',
                            borderRadius: 'var(--radius-sm)',
                            background: sk.is_mandatory ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                            color: sk.is_mandatory ? '#a5b4fc' : 'var(--text-secondary)',
                            border: `1px solid ${sk.is_mandatory ? 'rgba(99, 102, 241, 0.3)' : 'var(--border-color)'}`,
                          }}
                        >
                          {sk.name} {sk.is_mandatory ? '(Req Lv' + sk.min_level + ')' : '(Pref)'}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Right Action & Info Box */}
                  <div style={{
                    minWidth: '220px',
                    textAlign: 'right',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                    gap: '10px'
                  }}>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--success)' }}>
                      ₹{parseFloat(p.stipend).toLocaleString()}
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 400 }}>/mo</span>
                    </div>

                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Openings: {p.filled} / {p.openings} filled
                    </div>

                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Deadline: {new Date(p.deadline).toLocaleDateString()}
                    </div>

                    {/* Eligibility Pills */}
                    <div>
                      {!p.is_cgpa_eligible ? (
                        <span className="badge badge-rejected" style={{ fontSize: '0.72rem' }}>
                          Min CGPA: {p.min_cgpa} (Ineligible)
                        </span>
                      ) : !p.is_dept_eligible ? (
                        <span className="badge badge-rejected" style={{ fontSize: '0.72rem' }}>
                          Dept Restricted
                        </span>
                      ) : (
                        <span className="badge badge-accepted" style={{ fontSize: '0.72rem' }}>
                          ✓ Eligible (Min {p.min_cgpa})
                        </span>
                      )}
                    </div>

                    {/* Apply Button or Applied Status */}
                    {p.student_stage ? (
                      <div className="badge badge-interview" style={{ padding: '8px 16px', fontSize: '0.82rem' }}>
                        Current Status: {p.student_stage}
                      </div>
                    ) : (
                      <button
                        onClick={() => handleApply(p.posting_id)}
                        disabled={!isEligible || applyingId === p.posting_id}
                        className="btn btn-primary"
                        style={{
                          width: '100%',
                          opacity: !isEligible ? 0.5 : 1,
                          cursor: !isEligible ? 'not-allowed' : 'pointer'
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
