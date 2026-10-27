'use client';

import React, { useEffect, useState } from 'react';
import PageHeader from '../../../components/PageHeader';
import EmptyState from '../../../components/EmptyState';
import StatusBadge from '../../../components/StatusBadge';
import {
  IconUsers,
  IconCheck,
  IconAlertCircle,
  IconSparkles,
  IconX,
  IconArrowRight,
  IconClock,
} from '@tabler/icons-react';

export default function RecruiterApplicantsPage() {
  const [postings, setPostings] = useState([]);
  const [selectedPostingId, setSelectedPostingId] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppIds, setSelectedAppIds] = useState([]);
  const [bulkStage, setBulkStage] = useState('Shortlisted');
  const [bulkReason, setBulkReason] = useState('Review panel screening approved');
  const [updating, setUpdating] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [similarCandidates, setSimilarCandidates] = useState([]);
  const [loadingSimilar, setLoadingSimilar] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/api/recruiter/postings')
      .then((res) => res.json())
      .then((data) => {
        setPostings(data.postings || []);
        if (data.postings?.length > 0) {
          setSelectedPostingId(data.postings[0].posting_id.toString());
        } else {
          setLoading(false);
        }
      });
  }, []);

  const fetchApplicants = (postingId, stage) => {
    if (!postingId) return;
    setLoading(true);
    let url = `/api/recruiter/postings/${postingId}/applicants`;
    if (stage) url += `?stage=${stage}`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        setApplicants(data.applicants || []);
        setSelectedAppIds([]);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    if (selectedPostingId) {
      fetchApplicants(selectedPostingId, stageFilter);
    }
  }, [selectedPostingId, stageFilter]);

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedAppIds(applicants.map((a) => a.application_id));
    } else {
      setSelectedAppIds([]);
    }
  };

  const handleToggleSelect = (id) => {
    if (selectedAppIds.includes(id)) {
      setSelectedAppIds(selectedAppIds.filter((x) => x !== id));
    } else {
      setSelectedAppIds([...selectedAppIds, id]);
    }
  };

  const handleBulkAdvance = async () => {
    if (selectedAppIds.length === 0) return;
    setUpdating(true);
    setMessage(null);
    setError(null);

    try {
      const res = await fetch('/api/recruiter/applications/bulk-stage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationIds: selectedAppIds,
          newStage: bulkStage,
          reason: bulkReason,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Bulk update failed');

      setMessage(data.message);
      fetchApplicants(selectedPostingId, stageFilter);
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleFindSimilar = async (studentId) => {
    setLoadingSimilar(true);
    setSimilarCandidates([]);
    try {
      const res = await fetch(`/api/recruiter/candidates/${studentId}/similar`);
      const data = await res.json();
      if (res.ok) {
        setSimilarCandidates(data.similarCandidates || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSimilar(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      <PageHeader
        eyebrow="Candidate Funnel • pgvector Ranking & Bulk Transitions"
        title="Applicants Manager"
        subtitle="Ranked applicant review with match scoring, savepoint-isolated bulk transitions, and vector similarity search"
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
            {applicants.length} Candidate{applicants.length === 1 ? '' : 's'} Ranked
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

      {/* Select Posting & Stage Filters */}
      <div className="card" style={{ padding: '20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
          <div>
            <label className="form-label">Active Role Posting</label>
            <select
              className="form-select"
              style={{ width: '100%' }}
              value={selectedPostingId}
              onChange={(e) => setSelectedPostingId(e.target.value)}
            >
              {postings.map((p) => (
                <option key={p.posting_id} value={p.posting_id}>
                  {p.title} ({p.total_applicants} Applicants • ₹{parseFloat(p.stipend).toLocaleString()}/mo)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label">Filter by Pipeline Stage</label>
            <select
              className="form-select"
              style={{ width: '100%' }}
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
            >
              <option value="">All Pipeline Stages</option>
              <option value="Applied">Applied (Pending Review)</option>
              <option value="Shortlisted">Shortlisted</option>
              <option value="Interview">Interview</option>
              <option value="Offered">Offered</option>
              <option value="Accepted">Accepted</option>
              <option value="Rejected">Rejected</option>
              <option value="Withdrawn">Withdrawn</option>
            </select>
          </div>
        </div>

        {/* Bulk Action Controls Toolbar */}
        {selectedAppIds.length > 0 && (
          <div
            style={{
              marginTop: '16px',
              paddingTop: '16px',
              borderTop: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div
              style={{
                fontFamily: 'var(--font-mono), monospace',
                fontSize: '0.78rem',
                fontWeight: 600,
                color: 'var(--ink)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span className="indicator-dot-green" />
              <span>{selectedAppIds.length} candidate(s) selected</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <select
                className="form-select"
                style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                value={bulkStage}
                onChange={(e) => setBulkStage(e.target.value)}
              >
                <option value="Shortlisted">Advance to Shortlisted</option>
                <option value="Interview">Advance to Interview</option>
                <option value="Offered">Advance to Offered</option>
                <option value="Rejected">Mark as Rejected</option>
              </select>

              <button
                type="button"
                onClick={handleBulkAdvance}
                disabled={updating}
                className="btn btn-primary btn-sm"
              >
                {updating ? 'Processing Savepoints...' : 'Apply Bulk Transition →'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Applicants Table */}
      {loading ? (
        <div style={{ height: '300px', background: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }} />
      ) : applicants.length === 0 ? (
        <EmptyState
          icon={<IconUsers size={28} />}
          title="No applicants found for this filter"
          description="Candidates who apply for this role will appear here ordered by hybrid match score and pgvector cosine distance."
        />
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}>
                  <input
                    type="checkbox"
                    checked={selectedAppIds.length === applicants.length && applicants.length > 0}
                    onChange={handleSelectAll}
                  />
                </th>
                <th>Candidate Details</th>
                <th>Dept & CGPA</th>
                <th>Hybrid Match</th>
                <th>Vector Cosine</th>
                <th>Current Stage</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {applicants.map((app) => (
                <tr key={app.application_id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedAppIds.includes(app.application_id)}
                      onChange={() => handleToggleSelect(app.application_id)}
                    />
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--ink)' }}>{app.full_name}</div>
                    <div style={{ fontFamily: 'var(--font-mono), monospace', fontSize: '0.72rem', color: 'var(--ink-muted)' }}>
                      {app.usn} • Year {app.year}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.84rem', color: 'var(--ink)' }}>{app.dept_name} ({app.dept_code})</div>
                    <div style={{ fontFamily: 'var(--font-mono), monospace', fontSize: '0.74rem', color: '#047857', fontWeight: 600 }}>
                      CGPA: {app.cgpa}
                    </div>
                  </td>
                  <td>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono), monospace',
                        fontSize: '0.76rem',
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: '999px',
                        backgroundColor: 'var(--surface-subtle)',
                        border: '1px solid var(--border)',
                        color: 'var(--ink)',
                      }}
                    >
                      {Math.round(app.match_score)}%
                    </span>
                  </td>
                  <td>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono), monospace',
                        fontSize: '0.76rem',
                        color: 'var(--ink-muted)',
                      }}
                    >
                      {Math.round(parseFloat(app.vector_similarity || 0) * 100)}%
                    </span>
                  </td>
                  <td>
                    <StatusBadge status={app.current_stage} />
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCandidate(app);
                        handleFindSimilar(app.student_id);
                      }}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.74rem' }}
                    >
                      View Profile & Similar →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Candidate Details & Similar Candidates Modal */}
      {selectedCandidate && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '720px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 800, margin: 0, color: 'var(--ink)' }}>
                  {selectedCandidate.full_name}
                </h2>
                <div style={{ fontFamily: 'var(--font-mono), monospace', fontSize: '0.76rem', color: 'var(--ink-muted)', marginTop: '4px' }}>
                  {selectedCandidate.usn} • {selectedCandidate.dept_name} • CGPA {selectedCandidate.cgpa}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCandidate(null)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--ink-muted)' }}
              >
                <IconX size={20} />
              </button>
            </div>

            {/* Candidate Summary */}
            <div
              style={{
                backgroundColor: 'var(--surface-subtle)',
                border: '1px solid var(--border)',
                padding: '14px 16px',
                borderRadius: 'var(--radius-md)',
                marginBottom: '16px',
                fontSize: '0.84rem',
              }}
            >
              <div style={{ fontFamily: 'var(--font-mono), monospace', fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-muted)', marginBottom: '4px' }}>
                Professional Summary
              </div>
              <p style={{ margin: 0, color: 'var(--ink)', lineHeight: 1.5 }}>
                {selectedCandidate.about || 'No summary provided.'}
              </p>
            </div>

            {/* Skills */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontFamily: 'var(--font-mono), monospace', fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-muted)', marginBottom: '8px' }}>
                Skills & Proficiency Levels
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {selectedCandidate.student_skills?.map((sk, idx) => (
                  <span
                    key={idx}
                    style={{
                      fontFamily: 'var(--font-mono), monospace',
                      fontSize: '0.72rem',
                      padding: '2px 8px',
                      borderRadius: '999px',
                      backgroundColor: 'var(--surface-subtle)',
                      border: '1px solid var(--border)',
                      color: 'var(--ink)',
                    }}
                  >
                    {sk.name} (Lv {sk.proficiency})
                  </span>
                ))}
              </div>
            </div>

            {/* Stage History Timeline */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontFamily: 'var(--font-mono), monospace', fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-muted)', marginBottom: '8px' }}>
                Immutable Stage Transition History (PostgreSQL)
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {selectedCandidate.stage_history?.map((h, i) => (
                  <div
                    key={i}
                    style={{
                      fontSize: '0.76rem',
                      fontFamily: 'var(--font-mono), monospace',
                      padding: '8px 12px',
                      backgroundColor: 'var(--surface-subtle)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span style={{ color: 'var(--ink)', fontWeight: 600 }}>{h.to_stage}</span>
                    <span style={{ color: 'var(--ink-muted)' }}>
                      {h.reason} ({new Date(h.changed_at).toLocaleString()})
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Find Similar Candidates Section (pgvector) */}
            <div style={{ paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
              <div style={{ fontFamily: 'var(--font-mono), monospace', fontSize: '0.78rem', fontWeight: 700, color: 'var(--ink)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <IconSparkles size={15} color="var(--accent-secondary)" />
                <span>Similar Candidates via pgvector Cosine Distance</span>
              </div>

              {loadingSimilar ? (
                <div style={{ fontSize: '0.8rem', color: 'var(--ink-muted)' }}>Running vector similarity search...</div>
              ) : similarCandidates.length === 0 ? (
                <div style={{ fontSize: '0.8rem', color: 'var(--ink-muted)' }}>No other candidate profiles found.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {similarCandidates.map((c) => (
                    <div
                      key={c.student_id}
                      style={{
                        padding: '10px 14px',
                        backgroundColor: 'var(--surface-subtle)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-md)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.86rem', color: 'var(--ink)' }}>
                          {c.full_name}{' '}
                          <span style={{ fontFamily: 'var(--font-mono), monospace', fontSize: '0.74rem', color: 'var(--ink-muted)' }}>
                            ({c.usn})
                          </span>
                        </div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--ink-muted)', marginTop: '2px' }}>
                          {c.dept_name} • CGPA {c.cgpa}
                        </div>
                      </div>
                      <span
                        style={{
                          fontFamily: 'var(--font-mono), monospace',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: '999px',
                          backgroundColor: 'rgba(59, 107, 143, 0.08)',
                          color: 'var(--accent-secondary)',
                        }}
                      >
                        {Math.round(parseFloat(c.semantic_similarity) * 100)}% Profile Similarity
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ marginTop: '24px', textAlign: 'right' }}>
              <button type="button" onClick={() => setSelectedCandidate(null)} className="btn btn-secondary btn-sm">
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
