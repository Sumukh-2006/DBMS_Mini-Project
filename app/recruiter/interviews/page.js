'use client';

import React, { useEffect, useState } from 'react';
import PageHeader from '../../../components/PageHeader';
import EmptyState from '../../../components/EmptyState';
import StatusBadge from '../../../components/StatusBadge';
import {
  IconCalendarEvent,
  IconPlus,
  IconFileText,
  IconCheck,
  IconAlertCircle,
  IconX,
  IconVideo,
} from '@tabler/icons-react';

export default function RecruiterInterviewsPage() {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedAppId, setSelectedAppId] = useState('');
  const [roundNo, setRoundNo] = useState('1');
  const [scheduledAt, setScheduledAt] = useState(new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 16));
  const [durationMin, setDurationMin] = useState('45');
  const [linkOrRoom, setLinkOrRoom] = useState('https://meet.google.com/xyz-interntrack');

  // Feedback fields
  const [feedbackInterviewId, setFeedbackInterviewId] = useState('1');
  const [rubric, setRubric] = useState({ dsa: 4, system_design: 5, communication: 4, problem_solving: 5 });
  const [comments, setComments] = useState('');
  const [recommendation, setRecommendation] = useState('Hire');

  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchCandidates = () => {
    setLoading(true);
    fetch('/api/recruiter/postings')
      .then((res) => res.json())
      .then(async (data) => {
        const postings = data.postings || [];
        const allApplicants = [];
        for (const p of postings) {
          const appRes = await fetch(`/api/recruiter/postings/${p.posting_id}/applicants`);
          const appData = await appRes.json();
          (appData.applicants || []).forEach((a) => {
            allApplicants.push({ ...a, posting_title: p.title });
          });
        }
        setCandidates(allApplicants);
        if (allApplicants.length > 0) setSelectedAppId(allApplicants[0].application_id.toString());
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchCandidates();
  }, []);

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);
    setError(null);

    try {
      const res = await fetch('/api/recruiter/interviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId: selectedAppId,
          roundNo,
          scheduledAt,
          durationMin,
          linkOrRoom,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to schedule interview');

      setMessage('Interview scheduled successfully! Student notification dispatched in MongoDB.');
      setShowScheduleModal(false);
      fetchCandidates();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);
    setError(null);

    try {
      const res = await fetch('/api/recruiter/interviews/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          interviewId: feedbackInterviewId,
          rubric,
          comments,
          recommendation,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit feedback');

      setMessage('Interview evaluation feedback recorded in MongoDB document store.');
      setShowFeedbackModal(false);
      setComments('');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      <PageHeader
        eyebrow="Evaluation & Scheduling • Clash Detection & MongoDB Rubrics"
        title="Interview Scheduling & Feedback"
        subtitle="Multi-round scheduling with automatic clash detection and MongoDB structured evaluation rubrics"
        actions={
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => setShowScheduleModal(true)}
              className="btn btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <IconPlus size={16} /> Schedule Round
            </button>
            <button
              onClick={() => setShowFeedbackModal(true)}
              className="btn btn-secondary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <IconFileText size={16} /> Submit Feedback
            </button>
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

      {/* Active Candidate Pipeline Table */}
      {loading ? (
        <div style={{ height: '300px', background: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }} />
      ) : candidates.length === 0 ? (
        <EmptyState
          icon={<IconCalendarEvent size={28} />}
          title="No candidates in active pipeline"
          description="Candidates who apply for your postings will appear here ready for interview scheduling."
        />
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Candidate</th>
                <th>Role Posting</th>
                <th>CGPA & Dept</th>
                <th>Current Stage</th>
                <th>Match Score</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {candidates.map((c) => (
                <tr key={c.application_id}>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--ink)' }}>{c.full_name}</div>
                    <div style={{ fontFamily: 'var(--font-mono), monospace', fontSize: '0.72rem', color: 'var(--ink-muted)' }}>
                      {c.usn}
                    </div>
                  </td>
                  <td>{c.posting_title}</td>
                  <td>
                    <div style={{ fontSize: '0.84rem' }}>{c.dept_name}</div>
                    <div style={{ fontFamily: 'var(--font-mono), monospace', fontSize: '0.74rem', color: '#047857', fontWeight: 600 }}>
                      CGPA: {c.cgpa}
                    </div>
                  </td>
                  <td>
                    <StatusBadge status={c.current_stage} />
                  </td>
                  <td>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono), monospace',
                        fontSize: '0.76rem',
                        fontWeight: 700,
                        color: 'var(--ink)',
                      }}
                    >
                      {Math.round(c.match_score)}%
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      onClick={() => {
                        setSelectedAppId(c.application_id.toString());
                        setShowScheduleModal(true);
                      }}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.74rem' }}
                    >
                      Schedule Round →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Schedule Interview Modal */}
      {showScheduleModal && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '540px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--ink)' }}>
                Schedule Interview Round
              </h2>
              <button
                type="button"
                onClick={() => setShowScheduleModal(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--ink-muted)' }}
              >
                <IconX size={20} />
              </button>
            </div>
            <p style={{ fontSize: '0.84rem', color: 'var(--ink-muted)', marginBottom: '20px' }}>
              Enforces database-level clash detection for student and interviewer calendar slots.
            </p>

            <form onSubmit={handleScheduleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label className="form-label">Candidate Application</label>
                <select
                  className="form-select"
                  style={{ width: '100%' }}
                  value={selectedAppId}
                  onChange={(e) => setSelectedAppId(e.target.value)}
                >
                  {candidates.map((c) => (
                    <option key={c.application_id} value={c.application_id}>
                      {c.full_name} ({c.usn}) — {c.posting_title} [{c.current_stage}]
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="form-label">Round Number</label>
                  <input
                    type="number"
                    min="1"
                    className="form-input"
                    style={{ width: '100%' }}
                    value={roundNo}
                    onChange={(e) => setRoundNo(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="form-label">Duration (Minutes)</label>
                  <input
                    type="number"
                    min="15"
                    step="15"
                    className="form-input"
                    style={{ width: '100%' }}
                    value={durationMin}
                    onChange={(e) => setDurationMin(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Scheduled Date & Time</label>
                <input
                  type="datetime-local"
                  className="form-input"
                  style={{ width: '100%' }}
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="form-label">Meeting URL or Campus Room</label>
                <input
                  type="text"
                  className="form-input"
                  style={{ width: '100%' }}
                  value={linkOrRoom}
                  onChange={(e) => setLinkOrRoom(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '14px' }}>
                <button type="button" onClick={() => setShowScheduleModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn btn-primary">
                  {submitting ? 'Verifying Clashes...' : 'Confirm & Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Feedback Submission Modal */}
      {showFeedbackModal && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '540px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--ink)' }}>
                Record Interview Evaluation
              </h2>
              <button
                type="button"
                onClick={() => setShowFeedbackModal(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--ink-muted)' }}
              >
                <IconX size={20} />
              </button>
            </div>
            <p style={{ fontSize: '0.84rem', color: 'var(--ink-muted)', marginBottom: '20px' }}>
              Structured evaluation rubrics are saved directly in MongoDB document store.
            </p>

            <form onSubmit={handleFeedbackSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label className="form-label">Interview ID</label>
                <input
                  type="number"
                  className="form-input"
                  style={{ width: '100%' }}
                  value={feedbackInterviewId}
                  onChange={(e) => setFeedbackInterviewId(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="form-label">DSA / Coding (1-5)</label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    className="form-input"
                    style={{ width: '100%' }}
                    value={rubric.dsa}
                    onChange={(e) => setRubric({ ...rubric, dsa: parseFloat(e.target.value) })}
                    required
                  />
                </div>
                <div>
                  <label className="form-label">System Architecture (1-5)</label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    className="form-input"
                    style={{ width: '100%' }}
                    value={rubric.system_design}
                    onChange={(e) => setRubric({ ...rubric, system_design: parseFloat(e.target.value) })}
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Communication (1-5)</label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    className="form-input"
                    style={{ width: '100%' }}
                    value={rubric.communication}
                    onChange={(e) => setRubric({ ...rubric, communication: parseFloat(e.target.value) })}
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Problem Solving (1-5)</label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    className="form-input"
                    style={{ width: '100%' }}
                    value={rubric.problem_solving}
                    onChange={(e) => setRubric({ ...rubric, problem_solving: parseFloat(e.target.value) })}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Hiring Recommendation</label>
                <select
                  className="form-select"
                  style={{ width: '100%' }}
                  value={recommendation}
                  onChange={(e) => setRecommendation(e.target.value)}
                >
                  <option value="Strong Hire">Strong Hire</option>
                  <option value="Hire">Hire</option>
                  <option value="Hold">Hold</option>
                  <option value="No Hire">No Hire</option>
                </select>
              </div>

              <div>
                <label className="form-label">Panel Comments & Evaluation Notes</label>
                <textarea
                  className="form-textarea"
                  style={{ width: '100%' }}
                  rows="3"
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Notes on algorithmic complexity, code hygiene, and design trade-offs..."
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '14px' }}>
                <button type="button" onClick={() => setShowFeedbackModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn btn-primary">
                  {submitting ? 'Saving to MongoDB...' : 'Save Feedback'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
