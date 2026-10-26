'use client';
// app/student/offers/page.js - Offer Review & Concurrency-Safe Acceptance with Placement Cascade
import React, { useEffect, useState } from 'react';

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
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Internship Offers</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
          Official placement offers issued by verified employers
        </p>
      </div>

      {message && (
        <div style={{
          background: 'var(--success-bg)',
          border: '1px solid var(--success)',
          color: '#6ee7b7',
          padding: '16px 20px',
          borderRadius: 'var(--radius-lg)',
          marginBottom: '24px',
          fontSize: '0.92rem',
          lineHeight: 1.5
        }}>
          {message}
        </div>
      )}

      {error && (
        <div style={{
          background: 'var(--danger-bg)',
          border: '1px solid var(--danger)',
          color: '#fca5a5',
          padding: '16px 20px',
          borderRadius: 'var(--radius-lg)',
          marginBottom: '24px',
          fontSize: '0.92rem',
          lineHeight: 1.5
        }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ color: 'var(--text-secondary)' }}>Loading offers...</div>
      ) : offers.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>🎁</div>
          <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>No offers received yet</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>
            When recruiters complete technical rounds and issue offers, they will appear here.
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {offers.map((o) => {
            const isPending = o.status === 'pending' && !o.is_expired;
            return (
              <div key={o.offer_id} className="glass-card" style={{ padding: '28px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                      <span className="badge badge-applied">{o.company_name}</span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>📍 {o.location} • {o.mode}</span>
                      {o.status === 'accepted' ? (
                        <span className="badge badge-accepted">✓ Accepted Offer</span>
                      ) : o.status === 'declined' ? (
                        <span className="badge badge-rejected">Declined</span>
                      ) : o.is_expired ? (
                        <span className="badge badge-rejected">Expired</span>
                      ) : (
                        <span className="badge badge-interview">Pending Response</span>
                      )}
                    </div>

                    <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#fff' }}>
                      {o.posting_title}
                    </h2>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginTop: '16px' }}>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Monthly Stipend</div>
                        <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--success)', marginTop: '2px' }}>
                          ₹{parseFloat(o.stipend).toLocaleString()}
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Start Date</div>
                        <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '4px' }}>
                          {new Date(o.start_date).toLocaleDateString()}
                        </div>
                      </div>

                      <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Response Expiry</div>
                        <div style={{ fontSize: '0.95rem', fontWeight: 600, color: isPending ? '#fbbf24' : 'var(--text-muted)', marginTop: '4px' }}>
                          {new Date(o.expires_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions for Pending Offers */}
                  {isPending && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', minWidth: '180px' }}>
                      <button
                        onClick={() => handleRespond(o.offer_id, 'accept')}
                        disabled={respondingId === o.offer_id}
                        className="btn btn-primary"
                        style={{ background: 'linear-gradient(135deg, #10b981, #059669)', width: '100%' }}
                      >
                        {respondingId === o.offer_id ? 'Accepting...' : 'Accept Offer ✓'}
                      </button>

                      <button
                        onClick={() => handleRespond(o.offer_id, 'decline')}
                        disabled={respondingId === o.offer_id}
                        className="btn btn-secondary btn-sm"
                        style={{ width: '100%', color: '#f87171' }}
                      >
                        Decline Offer
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
