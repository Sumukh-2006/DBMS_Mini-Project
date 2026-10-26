'use client';
// app/admin/verifications/page.js - Employer & Recruiter Verification Queue
import React, { useEffect, useState } from 'react';

export default function VerificationsPage() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [message, setMessage] = useState(null);

  const fetchVerifications = () => {
    setLoading(true);
    fetch('/api/admin/verifications')
      .then((res) => res.json())
      .then((data) => {
        setCompanies(data.pendingCompanies || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchVerifications();
  }, []);

  const handleAction = async (companyId, action) => {
    try {
      setProcessingId(companyId);
      setMessage(null);

      const res = await fetch('/api/admin/verifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId, action }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Action failed');

      setMessage(`Company ${action === 'approve' ? 'approved and verified' : 'rejected'} successfully.`);
      fetchVerifications();
    } catch (err) {
      alert(err.message);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Company Verification Queue</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
          Placement cell verification checks for newly registered corporate partners
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

      {loading ? (
        <div style={{ color: 'var(--text-secondary)' }}>Loading verification requests...</div>
      ) : companies.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>🛡️</div>
          <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>No pending verification requests</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>
            All registered employers have been vetted and approved.
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {companies.map((c) => (
            <div key={c.company_id} className="glass-card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <span className="badge badge-interview">Pending Review</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Registered: {new Date(c.created_at).toLocaleDateString()}</span>
                  </div>

                  <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#fff' }}>{c.name}</h2>
                  <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    Industry: <strong>{c.industry}</strong> • Size: {c.size}
                  </div>

                  {c.website && (
                    <div style={{ marginTop: '6px' }}>
                      <a href={c.website} target="_blank" rel="noreferrer" style={{ fontSize: '0.82rem', color: '#60a5fa', textDecoration: 'underline' }}>
                        Visit Website ({c.website}) ↗
                      </a>
                    </div>
                  )}

                  {c.recruiters?.length > 0 && (
                    <div style={{ marginTop: '14px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      Registered Point of Contact: {c.recruiters.map((r) => `${r.email} (${r.designation})`).join(', ')}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => handleAction(c.company_id, 'reject')}
                    disabled={processingId === c.company_id}
                    className="btn btn-secondary btn-sm"
                    style={{ color: '#f87171' }}
                  >
                    Reject
                  </button>

                  <button
                    onClick={() => handleAction(c.company_id, 'approve')}
                    disabled={processingId === c.company_id}
                    className="btn btn-primary btn-sm"
                    style={{ background: '#10b981' }}
                  >
                    {processingId === c.company_id ? 'Approving...' : 'Approve & Verify ✓'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
