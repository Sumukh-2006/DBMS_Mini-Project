'use client';

import React, { useEffect, useState } from 'react';
import PageHeader from '../../../components/PageHeader';
import EmptyState from '../../../components/EmptyState';
import {
  IconGift,
  IconCheck,
  IconAlertCircle,
  IconClock,
  IconCalendarEvent,
  IconShieldCheck,
  IconMapPin,
} from '@tabler/icons-react';

export default function StudentOffersPage() {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [respondingId, setRespondingId] = useState(null);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const fetchOffers = () => {
    setLoading(true);
    fetch('/api/student/offers')
      .then((res) => res.json())
      .then((data) => {
        setOffers(data.offers || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchOffers();
  }, []);

  const handleRespond = async (offerId, action) => {
    if (action === 'accept') {
      const confirmAccept = confirm(
        '⚠️ UNIVERSITY PLACEMENT POLICY WARNING:\n\n' +
        'Accepting this offer is a binding decision enforced at the database level. ' +
        'All your other active applications across all companies will be automatically WITHDRAWN. ' +
        'Are you sure you want to proceed and finalize your placement?'
      );
      if (!confirmAccept) return;
    }

    try {
      setRespondingId(offerId);
      setMessage(null);
      setError(null);

      const res = await fetch('/api/student/offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offerId, action }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to process offer response');

      setMessage(data.message);
      fetchOffers();
    } catch (err) {
      setError(err.message);
    } finally {
      setRespondingId(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      <PageHeader
        eyebrow="Placement Cascade • ACID Transactional Acceptance"
        title="Internship Offers"
        subtitle="Official placement offers issued by verified employers. Acceptance triggers sp_accept_offer to auto-withdraw conflicting applications."
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
            <span>sp_accept_offer Governed</span>
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

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {[1, 2].map((i) => (
            <div key={i} style={{ height: '180px', background: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }} />
          ))}
        </div>
      ) : offers.length === 0 ? (
        <EmptyState
          icon={<IconGift size={28} />}
          title="No offers received yet"
          description="When recruiters complete interview rounds and issue offers, they will appear here with complete compensation details."
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {offers.map((o) => {
            const isPending = o.status === 'pending' && !o.is_expired;
            return (
              <div
                key={o.offer_id}
                className="card"
                style={{
                  padding: '28px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: '24px',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ flex: 1, minWidth: '320px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono), monospace',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '3px 10px',
                        borderRadius: '999px',
                        backgroundColor: 'var(--surface-subtle)',
                        border: '1px solid var(--border)',
                        color: 'var(--ink)',
                      }}
                    >
                      {o.company_name}
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
                      <IconMapPin size={13} /> {o.location} • {o.mode}
                    </span>

                    {o.status === 'accepted' ? (
                      <span
                        style={{
                          fontFamily: 'var(--font-mono), monospace',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          padding: '3px 10px',
                          borderRadius: '999px',
                          backgroundColor: 'rgba(16, 185, 129, 0.08)',
                          color: '#047857',
                          border: '1px solid rgba(16, 185, 129, 0.25)',
                        }}
                      >
                        ✓ ACCEPTED OFFER
                      </span>
                    ) : o.status === 'declined' ? (
                      <span
                        style={{
                          fontFamily: 'var(--font-mono), monospace',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          padding: '3px 10px',
                          borderRadius: '999px',
                          backgroundColor: 'var(--surface-subtle)',
                          color: 'var(--ink-muted)',
                          border: '1px solid var(--border)',
                        }}
                      >
                        DECLINED
                      </span>
                    ) : o.is_expired ? (
                      <span
                        style={{
                          fontFamily: 'var(--font-mono), monospace',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          padding: '3px 10px',
                          borderRadius: '999px',
                          backgroundColor: 'rgba(217, 45, 32, 0.08)',
                          color: 'var(--accent)',
                          border: '1px solid rgba(217, 45, 32, 0.2)',
                        }}
                      >
                        EXPIRED
                      </span>
                    ) : (
                      <span
                        style={{
                          fontFamily: 'var(--font-mono), monospace',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          padding: '3px 10px',
                          borderRadius: '999px',
                          backgroundColor: 'rgba(217, 119, 6, 0.08)',
                          color: '#b45309',
                          border: '1px solid rgba(217, 119, 6, 0.25)',
                        }}
                      >
                        PENDING RESPONSE
                      </span>
                    )}
                  </div>

                  <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--ink)', margin: 0 }}>
                    {o.posting_title}
                  </h2>

                  {/* Metadata Grid */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                      gap: '16px',
                      marginTop: '20px',
                      padding: '16px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--surface-subtle)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontFamily: 'var(--font-mono), monospace',
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          color: 'var(--ink-muted)',
                        }}
                      >
                        Monthly Stipend
                      </div>
                      <div
                        style={{
                          fontFamily: 'var(--font-mono), monospace',
                          fontSize: '1.4rem',
                          fontWeight: 700,
                          color: 'var(--ink)',
                          marginTop: '2px',
                        }}
                      >
                        ₹{parseFloat(o.stipend).toLocaleString()}
                        <span style={{ fontSize: '0.72rem', color: 'var(--ink-muted)', fontWeight: 400 }}> /mo</span>
                      </div>
                    </div>

                    <div>
                      <div
                        style={{
                          fontFamily: 'var(--font-mono), monospace',
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          color: 'var(--ink-muted)',
                        }}
                      >
                        Start Date
                      </div>
                      <div
                        style={{
                          fontFamily: 'var(--font-mono), monospace',
                          fontSize: '0.9rem',
                          fontWeight: 600,
                          color: 'var(--ink)',
                          marginTop: '4px',
                        }}
                      >
                        {new Date(o.start_date).toLocaleDateString()}
                      </div>
                    </div>

                    <div>
                      <div
                        style={{
                          fontFamily: 'var(--font-mono), monospace',
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          color: 'var(--ink-muted)',
                        }}
                      >
                        Response Deadline
                      </div>
                      <div
                        style={{
                          fontFamily: 'var(--font-mono), monospace',
                          fontSize: '0.9rem',
                          fontWeight: 600,
                          color: isPending ? 'var(--accent)' : 'var(--ink-muted)',
                          marginTop: '4px',
                        }}
                      >
                        {new Date(o.expires_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions for Pending Offers */}
                {isPending && (
                  <div
                    style={{
                      minWidth: '200px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                      alignItems: 'stretch',
                    }}
                  >
                    <button
                      onClick={() => handleRespond(o.offer_id, 'accept')}
                      disabled={respondingId === o.offer_id}
                      className="btn btn-primary"
                      style={{
                        width: '100%',
                        backgroundColor: '#047857',
                        borderColor: '#047857',
                      }}
                    >
                      {respondingId === o.offer_id ? 'Accepting...' : 'Accept Offer ✓'}
                    </button>

                    <button
                      onClick={() => handleRespond(o.offer_id, 'decline')}
                      disabled={respondingId === o.offer_id}
                      className="btn btn-secondary btn-sm"
                      style={{ width: '100%', color: 'var(--accent)' }}
                    >
                      Decline Offer
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
