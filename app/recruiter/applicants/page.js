'use client';
// app/recruiter/applicants/page.js - Ranked Applicants, Bulk Stage Advancement, and Vector Similarity
import React, { useEffect, useState } from 'react';

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

  // Load postings dropdown
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

  // Fetch applicants for chosen posting
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

  // Find Similar Candidates via pgvector
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
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Applicants Manager</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
          Ranked applicant review with match scoring, savepoint-isolated bulk transitions, and vector similarity search
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

      {/* Select Posting & Stage Filters */}
      <div className="glass-card" style={{ padding: '20px', marginBottom: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
          <div>
            <label className="form-label">Select Active Posting</label>
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
              <option value="">All Stages</option>
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

        {/* Bulk Action Controls */}
        {selectedAppIds.length > 0 && (
          <div style={{
            marginTop: '16px',
            paddingTop: '16px',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#a5b4fc' }}>
              ✓ {selectedAppIds.length} candidate(s) selected
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <select
                className="form-select"
                style={{ padding: '6px 12px', fontSize: '0.85rem' }}
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
        <div style={{ color: 'var(--text-secondary)' }}>Ranking candidate profiles...</div>
      ) : applicants.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>👥</div>
          <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>No applicants found for this filter</div>
        </div>
      ) : (
        <div className="data-table-container">
          <table className="data-table">
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
                <th>Department & CGPA</th>
                <th>Match Score</th>
                <th>Vector Cosine Sim</th>
                <th>Current Stage</th>
                <th>Actions</th>
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
                    <div style={{ fontWeight: 700, color: '#fff' }}>{app.full_name}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      {app.usn} • Year {app.year}
                    </div>
                  </td>
                  <td>
                    <div>{app.dept_name} ({app.dept_code})</div>
                    <div style={{ fontSize: '0.8rem', color: '#34d399', fontWeight: 600 }}>CGPA: {app.cgpa}</div>
                  </td>
                  <td>
                    <span style={{
                      fontWeight: 800,
                      padding: '4px 10px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(99, 102, 241, 0.15)',
                      color: '#818cf8',
                      fontSize: '0.88rem'
                    }}>
                      {Math.round(app.match_score)}%
                    </span>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.85rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                      {Math.round(parseFloat(app.vector_similarity || 0) * 100)}%
                    </div>
                  </td>
                  <td>
                    <span className={`badge badge-${app.current_stage.toLowerCase()}`}>
                      {app.current_stage}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCandidate(app);
                        handleFindSimilar(app.student_id);
                      }}
                      className="btn btn-secondary btn-sm"
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
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>{selectedCandidate.full_name}</h2>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  {selectedCandidate.usn} • {selectedCandidate.dept_name} • CGPA {selectedCandidate.cgpa}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCandidate(null)}
                style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '1.4rem', cursor: 'pointer' }}
              >
                ×
              </button>
            </div>

            {/* Candidate Summary */}
            <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '14px', borderRadius: 'var(--radius-md)', marginBottom: '16px', fontSize: '0.88rem' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase' }}>Professional Summary</div>
              <p style={{ marginTop: '4px', color: '#f3f4f6', lineHeight: 1.5 }}>
                {selectedCandidate.about || 'No summary provided.'}
              </p>
            </div>

            {/* Skills */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px' }}>
                Skills & Competency
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {selectedCandidate.student_skills?.map((sk, idx) => (
                  <span key={idx} className="badge badge-applied" style={{ fontSize: '0.75rem' }}>
                    {sk.name} (Lv {sk.proficiency})
                  </span>
                ))}
              </div>
            </div>

            {/* Stage History Timeline */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px' }}>
                Immutable Stage Transition History (PostgreSQL)
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {selectedCandidate.stage_history?.map((h, i) => (
                  <div key={i} style={{ fontSize: '0.8rem', padding: '6px 10px', background: 'rgba(0, 0, 0, 0.3)', borderRadius: '4px' }}>
                    <span style={{ color: '#818cf8', fontWeight: 600 }}>{h.to_stage}</span>
                    <span style={{ color: 'var(--text-muted)' }}> — {h.reason} ({new Date(h.changed_at).toLocaleString()})</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Find Similar Candidates Section (pgvector) */}
            <div style={{ paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#ec4899', marginBottom: '8px' }}>
                ✨ Similar Candidates Found via pgvector Embeddings (Cosine Distance)
              </div>

              {loadingSimilar ? (
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Running vector similarity search...</div>
              ) : similarCandidates.length === 0 ? (
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>No other candidate profiles found.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {similarCandidates.map((c) => (
                    <div
                      key={c.student_id}
                      style={{
                        padding: '10px 14px',
                        background: 'rgba(255, 255, 255, 0.03)',
                        borderRadius: 'var(--radius-md)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>{c.full_name} ({c.usn})</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {c.dept_name} • CGPA {c.cgpa}
                        </div>
                      </div>
                      <div className="badge badge-offered" style={{ fontSize: '0.72rem' }}>
                        {Math.round(parseFloat(c.semantic_similarity) * 100)}% Profile Similarity
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ marginTop: '20px', textAlign: 'right' }}>
              <button type="button" onClick={() => setSelectedCandidate(null)} className="btn btn-secondary btn-sm">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
