'use client';

import React, { useEffect, useState } from 'react';
import PageHeader from '../../../components/PageHeader';
import StatusBadge from '../../../components/StatusBadge';
import {
  IconGift,
  IconCheck,
  IconAlertCircle,
  IconShieldCheck,
} from '@tabler/icons-react';

export default function RecruiterOffersPage() {
  const [candidates, setCandidates] = useState([]);
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      <PageHeader
        eyebrow="Offer Lifecycle • Stored Procedure sp_issue_offer"
        title="Issue & Manage Offers"
        subtitle="Execute stored procedure sp_issue_offer to transition candidates to Offered stage with binding expiry windows"
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
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <IconShieldCheck size={14} color="var(--accent-secondary)" />
            <span>sp_issue_offer Governed</span>
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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px' }}>
        {/* Issue Offer Form */}
        <div className="card" style={{ padding: '28px' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0 0 16px 0', color: 'var(--ink)' }}>
            Issue Formal Placement Offer
          </h2>

          <form onSubmit={handleIssueOffer} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label className="form-label">Select Candidate</label>
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

            <div>
              <label className="form-label">Monthly Stipend (₹) *</label>
              <input
                type="number"
                min="0"
                className="form-input"
                style={{ width: '100%' }}
                value={stipend}
                onChange={(e) => setStipend(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="form-label">Internship Start Date *</label>
              <input
                type="date"
                className="form-input"
                style={{ width: '100%' }}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="form-label">Offer Expiry Window (Days)</label>
              <input
                type="number"
                min="1"
                max="30"
                className="form-input"
                style={{ width: '100%' }}
                value={expiryDays}
                onChange={(e) => setExpiryDays(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              disabled={submitting || candidates.length === 0}
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '8px' }}
            >
              {submitting ? 'Issuing Offer...' : 'Issue Offer via sp_issue_offer →'}
            </button>
          </form>
        </div>

        {/* Candidate Offer Status List */}
        <div className="card" style={{ padding: '28px' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0 0 16px 0', color: 'var(--ink)' }}>
            Candidate Offer Statuses
          </h2>

          {loading ? (
            <div style={{ color: 'var(--ink-muted)', fontSize: '0.85rem' }}>Loading candidate records...</div>
          ) : candidates.length === 0 ? (
            <div style={{ color: 'var(--ink-muted)', fontSize: '0.85rem' }}>No active candidates ready for offers.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {candidates.map((c) => (
                <div
                  key={c.application_id}
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
                    <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--ink)' }}>
                      {c.full_name}{' '}
                      <span style={{ fontFamily: 'var(--font-mono), monospace', fontSize: '0.74rem', color: 'var(--ink-muted)' }}>
                        ({c.usn})
                      </span>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--ink-muted)', marginTop: '2px' }}>
                      {c.posting_title} • CGPA {c.cgpa}
                    </div>
                  </div>

                  <StatusBadge status={c.current_stage} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
