'use client';
// app/recruiter/offers/page.js - Issue and Manage Internship Offers
import React, { useEffect, useState } from 'react';

export default function RecruiterOffersPage() {
  const [candidates, setCandidates] = useState([]);
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppId, setSelectedAppId] = useState('');
  const [stipend, setStipend] = useState('95000');
  const [startDate, setStartDate] = useState(new Date(Date.now() + 45 * 86400000).toISOString().slice(0, 10));
  const [expiryDays, setExpiryDays] = useState('7');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const pRes = await fetch('/api/recruiter/postings');
      const pData = await pRes.json();
      const allCandidates = [];

      for (const p of pData.postings || []) {
        const aRes = await fetch(`/api/recruiter/postings/${p.posting_id}/applicants`);
        const aData = await aRes.json();
        (aData.applicants || []).forEach((app) => {
          allCandidates.push({ ...app, posting_title: p.title });
        });
      }

      setCandidates(allCandidates.filter((c) => ['Shortlisted', 'Interview', 'Offered'].includes(c.current_stage)));
      if (allCandidates.length > 0) setSelectedAppId(allCandidates[0].application_id.toString());
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleIssueOffer = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);
    setError(null);

    try {
      const res = await fetch('/api/recruiter/offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId: selectedAppId,
          stipend,
          startDate,
          expiryDays,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to issue offer');

      setMessage('Offer issued successfully! Stored procedure sp_issue_offer executed.');
      fetchData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Issue & Manage Offers</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
          Execute stored procedure sp_issue_offer to transition candidates to Offered stage with expiry limits
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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: '24px' }}>
        {/* Issue Offer Form */}
        <div className="glass-card">
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '16px' }}>
            🎁 Issue Internship Offer
          </h2>

          <form onSubmit={handleIssueOffer}>
            <div className="form-group">
              <label className="form-label">Select Candidate</label>
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

            <div className="form-group">
              <label className="form-label">Monthly Stipend (₹) *</label>
              <input
                type="number"
                min="0"
                className="form-input"
                value={stipend}
                onChange={(e) => setStipend(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Internship Start Date *</label>
              <input
                type="date"
                className="form-input"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Offer Expiry Window (Days)</label>
              <input
                type="number"
                min="1"
                max="30"
                className="form-input"
                value={expiryDays}
                onChange={(e) => setExpiryDays(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              disabled={submitting || candidates.length === 0}
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '16px', background: 'linear-gradient(135deg, #ec4899, #be185d)' }}
            >
              {submitting ? 'Issuing Offer...' : 'Issue Offer via sp_issue_offer →'}
            </button>
          </form>
        </div>

        {/* Candidate Offer Status List */}
        <div className="glass-card">
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '16px' }}>
            Candidate Offer Statuses
          </h2>

          {loading ? (
            <div style={{ color: 'var(--text-secondary)' }}>Loading candidate records...</div>
          ) : candidates.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No active candidates ready for offers.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {candidates.map((c) => (
                <div
                  key={c.application_id}
                  style={{
                    padding: '14px',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#fff' }}>
                      {c.full_name} ({c.usn})
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {c.posting_title} • CGPA {c.cgpa}
                    </div>
                  </div>

                  <span className={`badge badge-${c.current_stage.toLowerCase()}`}>
                    {c.current_stage}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
