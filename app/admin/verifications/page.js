'use client';
// app/admin/verifications/page.js - Employer & Recruiter Verification Queue
import React, { useEffect, useState } from 'react';
import PageHeader from '../../../components/PageHeader';
import EmptyState from '../../../components/EmptyState';
import {
  IconShieldCheck,
  IconCheck,
  IconX,
  IconExternalLink,
  IconBuilding,
  IconMail,
} from '@tabler/icons-react';

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      <PageHeader
        title="Company Verification Queue"
        subtitle="Placement cell vetting checks for newly registered corporate partners before posting authorization"
        badge={
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="live-indicator-dot" />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', letterSpacing: '0.04em' }}>
              VETTING CONSOLE
            </span>
          </div>
        }
      />

      {message && (
        <div
          style={{
            background: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            color: '#0f766e',
            padding: '14px 18px',
            borderRadius: 'var(--radius-button)',
            fontSize: '0.88rem',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontFamily: 'var(--font-mono)',
          }}
        >
          <IconCheck size={18} />
          <span>{message}</span>
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '60px 0', justifyContent: 'center' }}>
          <span className="live-indicator-dot" />
          <span style={{ color: 'var(--ink-muted)', fontSize: '0.9rem', fontFamily: 'var(--font-mono)' }}>
            Loading verification requests...
          </span>
        </div>
      ) : companies.length === 0 ? (
        <div className="card" style={{ padding: '60px 24px' }}>
          <EmptyState
            icon={IconShieldCheck}
            title="All employers verified"
            description="There are no pending company registrations requiring placement cell approval. All active employers are fully authorized."
          />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {companies.map((c) => (
            <div key={c.company_id} className="card" style={{ padding: '24px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  flexWrap: 'wrap',
                  gap: '20px',
                }}
              >
                <div style={{ flex: 1, minWidth: '300px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', flexWrap: 'wrap' }}>
                    <span className="mono-badge" style={{ background: 'rgba(217, 119, 6, 0.1)', color: '#b45309' }}>
                      Pending Vetting
                    </span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--ink-muted)', fontFamily: 'var(--font-mono)' }}>
                      Registered: {new Date(c.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--ink)' }}>{c.name}</h2>
                  <div style={{ fontSize: '0.88rem', color: 'var(--ink-muted)', marginTop: '4px' }}>
                    Industry: <strong style={{ color: 'var(--ink)' }}>{c.industry}</strong> • Scale: {c.size}
                  </div>

                  {c.website && (
                    <div style={{ marginTop: '8px' }}>
                      <a
                        href={c.website}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '0.82rem',
                          color: 'var(--slate-blue)',
                          textDecoration: 'underline',
                          textUnderlineOffset: '3px',
                        }}
                      >
                        <span>{c.website}</span>
                        <IconExternalLink size={13} />
                      </a>
                    </div>
                  )}

                  {c.recruiters?.length > 0 && (
                    <div
                      style={{
                        marginTop: '14px',
                        padding: '10px 14px',
                        borderRadius: 'var(--radius-button)',
                        background: 'var(--surface-subtle)',
                        border: '1px solid var(--border)',
                        fontSize: '0.8rem',
                        color: 'var(--ink)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <IconMail size={16} color="var(--ink-muted)" />
                      <span>
                        Point of Contact:{' '}
                        <strong>
                          {c.recruiters.map((r) => `${r.email} (${r.designation})`).join(', ')}
                        </strong>
                      </span>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <button
                    onClick={() => handleAction(c.company_id, 'reject')}
                    disabled={processingId === c.company_id}
                    className="btn btn-secondary btn-sm"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      color: 'var(--coral)',
                    }}
                  >
                    <IconX size={14} />
                    <span>Reject</span>
                  </button>

                  <button
                    onClick={() => handleAction(c.company_id, 'approve')}
                    disabled={processingId === c.company_id}
                    className="btn btn-primary btn-sm"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: '#0f766e',
                      borderColor: '#0f766e',
                    }}
                  >
                    <IconCheck size={14} />
                    <span>{processingId === c.company_id ? 'Authorizing...' : 'Approve & Verify'}</span>
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
