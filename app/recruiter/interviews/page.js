'use client';
// app/recruiter/interviews/page.js - Interview Scheduler & MongoDB Feedback Form
import React, { useEffect, useState } from 'react';

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
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Interview Scheduling & Feedback</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
            Multi-round scheduling with automatic clash detection and MongoDB structured evaluation rubrics
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => setShowScheduleModal(true)} className="btn btn-primary" style={{ background: '#ec4899' }}>
            + Schedule Round
          </button>
          <button onClick={() => setShowFeedbackModal(true)} className="btn btn-secondary">
            📝 Submit Feedback
          </button>
        </div>
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

      {/* Active Candidate Pipeline Table */}
      {loading ? (
        <div style={{ color: 'var(--text-secondary)' }}>Loading candidate interview pipeline...</div>
      ) : candidates.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>📅</div>
          <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>No candidates available to schedule</div>
        </div>
      ) : (
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Candidate</th>
                <th>Role Posting</th>
                <th>CGPA & Dept</th>
                <th>Stage</th>
                <th>Match Score</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {candidates.map((c) => (
                <tr key={c.application_id}>
                  <td>
                    <div style={{ fontWeight: 700, color: '#fff' }}>{c.full_name}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{c.usn}</div>
                  </td>
                  <td>{c.posting_title}</td>
                  <td>
                    <div>{c.dept_name}</div>
                    <div style={{ fontSize: '0.8rem', color: '#34d399' }}>CGPA: {c.cgpa}</div>
                  </td>
                  <td>
                    <span className={`badge badge-${c.current_stage.toLowerCase()}`}>{c.current_stage}</span>
                  </td>
                  <td>
                    <strong style={{ color: '#818cf8' }}>{Math.round(c.match_score)}%</strong>
                  </td>
                  <td>
                    <button
                      onClick={() => {
                        setSelectedAppId(c.application_id.toString());
                        setShowScheduleModal(true);
                      }}
                      className="btn btn-secondary btn-sm"
                    >
                      Schedule Interview →
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
          <div className="modal-content">
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '8px' }}>Schedule Technical Interview Round</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              Enforces database-level clash detection for student and interviewer slots.
            </p>

            <form onSubmit={handleScheduleSubmit}>
              <div className="form-group">
                <label className="form-label">Candidate Application</label>
                <select
                  className="form-select"
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Round Number</label>
                  <input
                    type="number"
                    min="1"
                    className="form-input"
                    value={roundNo}
                    onChange={(e) => setRoundNo(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Duration (Minutes)</label>
                  <input
                    type="number"
                    min="15"
                    step="15"
                    className="form-input"
                    value={durationMin}
                    onChange={(e) => setDurationMin(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Scheduled Date & Time (UTC/Local)</label>
                <input
                  type="datetime-local"
                  className="form-input"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Meeting URL or Campus Room</label>
                <input
                  type="text"
                  className="form-input"
                  value={linkOrRoom}
                  onChange={(e) => setLinkOrRoom(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
                <button type="button" onClick={() => setShowScheduleModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn btn-primary" style={{ background: '#ec4899' }}>
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
          <div className="modal-content">
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '8px' }}>Record Interview Feedback</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              Structured evaluation rubrics are saved directly in MongoDB document store.
            </p>

            <form onSubmit={handleFeedbackSubmit}>
              <div className="form-group">
                <label className="form-label">Interview ID</label>
                <input
                  type="number"
                  className="form-input"
                  value={feedbackInterviewId}
                  onChange={(e) => setFeedbackInterviewId(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">DSA / Coding (1-5)</label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    className="form-input"
                    value={rubric.dsa}
                    onChange={(e) => setRubric({ ...rubric, dsa: parseFloat(e.target.value) })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">System Architecture (1-5)</label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    className="form-input"
                    value={rubric.system_design}
                    onChange={(e) => setRubric({ ...rubric, system_design: parseFloat(e.target.value) })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Communication (1-5)</label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    className="form-input"
                    value={rubric.communication}
                    onChange={(e) => setRubric({ ...rubric, communication: parseFloat(e.target.value) })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Problem Solving (1-5)</label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    className="form-input"
                    value={rubric.problem_solving}
                    onChange={(e) => setRubric({ ...rubric, problem_solving: parseFloat(e.target.value) })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Hiring Recommendation</label>
                <select
                  className="form-select"
                  value={recommendation}
                  onChange={(e) => setRecommendation(e.target.value)}
                >
                  <option value="Strong Hire">Strong Hire</option>
                  <option value="Hire">Hire</option>
                  <option value="Hold">Hold</option>
                  <option value="No Hire">No Hire</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Panel Comments & Evaluation Notes</label>
                <textarea
                  className="form-textarea"
                  rows="3"
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Notes on algorithmic complexity, code hygiene, and design trade-offs..."
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
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
