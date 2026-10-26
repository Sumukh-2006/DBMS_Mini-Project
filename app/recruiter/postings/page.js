'use client';
// app/recruiter/postings/page.js - Manage Company Postings
import React, { useEffect, useState } from 'react';
import Link from 'next/link';

export default function RecruiterPostingsPage() {
  const [postings, setPostings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/recruiter/postings')
      .then((res) => res.json())
      .then((data) => {
        setPostings(data.postings || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Company Postings</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
            Manage active role postings, track applicants, and review pipeline funnels
          </p>
        </div>

        <Link href="/recruiter/postings/create" className="btn btn-primary" style={{ background: 'linear-gradient(135deg, #ec4899, #be185d)' }}>
          + Create New Posting
        </Link>
      </div>

      {loading ? (
        <div style={{ color: 'var(--text-secondary)' }}>Loading postings...</div>
      ) : postings.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>📢</div>
          <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>No postings created yet</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '8px' }}>
            Create your company's first internship posting to begin receiving applications.
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {postings.map((p) => (
            <div key={p.posting_id} className="glass-card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <span className="badge badge-applied">{p.mode}</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>📍 {p.location}</span>
                    <span className={`badge ${p.status === 'open' ? 'badge-accepted' : 'badge-rejected'}`}>
                      {p.status.toUpperCase()}
                    </span>
                  </div>

                  <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#fff' }}>{p.title}</h2>
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginTop: '6px', maxWidth: '750px', lineHeight: 1.5 }}>
                    {p.description.slice(0, 220)}...
                  </p>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', marginTop: '14px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    <div>Stipend: <strong style={{ color: 'var(--success)' }}>₹{parseFloat(p.stipend).toLocaleString()}/mo</strong></div>
                    <div>Openings: <strong>{p.filled} / {p.openings} Filled</strong></div>
                    <div>Min CGPA: <strong>{p.min_cgpa}</strong></div>
                    <div>Deadline: <strong>{new Date(p.deadline).toLocaleDateString()}</strong></div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px', minWidth: '180px' }}>
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    padding: '10px 16px',
                    textAlign: 'center',
                    width: '100%'
                  }}>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#60a5fa' }}>
                      {p.total_applicants}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                      TOTAL APPLICANTS
                    </div>
                  </div>

                  <Link href={`/recruiter/applicants?postingId=${p.posting_id}`} className="btn btn-secondary btn-sm" style={{ width: '100%', justifyContent: 'center' }}>
                    View Applicants →
                  </Link>

                  <Link href={`/recruiter/analytics?postingId=${p.posting_id}`} className="btn btn-secondary btn-sm" style={{ width: '100%', justifyContent: 'center', fontSize: '0.75rem' }}>
                    Funnel Analytics 📈
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
