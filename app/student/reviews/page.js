'use client';

import React, { useEffect, useState } from 'react';
import PageHeader from '../../../components/PageHeader';
import EmptyState from '../../../components/EmptyState';
import {
  IconMessageCircle,
  IconCheck,
  IconStar,
  IconPlus,
  IconX,
} from '@tabler/icons-react';

export default function StudentReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState('1');
  const [ratings, setRatings] = useState({ mentorship: 5, learning: 5, work_life_balance: 4, compensation: 5 });
  const [reviewText, setReviewText] = useState('');
  const [tagsInput, setTagsInput] = useState('Mentorship, PPO Offered, Good Culture');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  const fetchReviews = () => {
    setLoading(true);
    fetch('/api/reviews')
      .then((res) => res.json())
      .then((data) => {
        setReviews(data.reviews || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchReviews();
    fetch('/api/student/postings')
      .then((res) => res.json())
      .then((data) => {
        const unique = [];
        const seen = new Set();
        (data.postings || []).forEach((p) => {
          if (!seen.has(p.company_id)) {
            seen.add(p.company_id);
            unique.push({ id: p.company_id, name: p.company_name });
          }
        });
        setCompanies(unique);
        if (unique.length > 0) setSelectedCompanyId(unique[0].id.toString());
      });
  }, []);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    try {
      const tags = tagsInput.split(',').map((t) => t.trim()).filter(Boolean);
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyId: selectedCompanyId,
          ratings,
          text: reviewText,
          tags,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit review');

      setMessage('Experience review submitted successfully to MongoDB!');
      setShowSubmitModal(false);
      setReviewText('');
      fetchReviews();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      <PageHeader
        eyebrow="Community Insights • MongoDB Document Collections"
        title="Company Experience Reviews"
        subtitle="Transparent reviews and multi-dimensional ratings from PES alumni stored in MongoDB document collections"
        action={
          <button
            onClick={() => setShowSubmitModal(true)}
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <IconPlus size={16} /> Write a Review
          </button>
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

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {[1, 2].map((i) => (
            <div key={i} style={{ height: '140px', background: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }} />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <EmptyState
          icon={<IconMessageCircle size={28} />}
          title="No reviews submitted yet"
          description="Be the first PES student to share authentic feedback on company mentorship, compensation, and interview rigor!"
          action={
            <button onClick={() => setShowSubmitModal(true)} className="btn btn-primary btn-sm">
              Write First Review
            </button>
          }
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {reviews.map((r, i) => (
            <div
              key={i}
              className="card"
              style={{
                padding: '24px 28px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: '24px',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ flex: 1, minWidth: '300px' }}>
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
                    {r.company_name}
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono), monospace',
                      fontSize: '0.74rem',
                      color: 'var(--ink-muted)',
                    }}
                  >
                    By {r.student_name} • {new Date(r.created_at).toLocaleDateString()}
                  </span>
                </div>

                <p style={{ fontSize: '0.94rem', color: 'var(--ink)', lineHeight: 1.5, margin: '12px 0 0 0' }}>
                  “{r.text}”
                </p>

                {r.tags?.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '14px' }}>
                    {r.tags.map((t, idx) => (
                      <span
                        key={idx}
                        style={{
                          fontFamily: 'var(--font-mono), monospace',
                          fontSize: '0.7rem',
                          padding: '2px 8px',
                          borderRadius: '999px',
                          backgroundColor: 'var(--surface-subtle)',
                          border: '1px solid var(--border)',
                          color: 'var(--ink-muted)',
                        }}
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Ratings Breakdown Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '8px 16px',
                  backgroundColor: 'var(--surface-subtle)',
                  padding: '14px 18px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border)',
                  fontFamily: 'var(--font-mono), monospace',
                  fontSize: '0.74rem',
                  minWidth: '220px',
                }}
              >
                <div>Mentorship: <strong style={{ color: 'var(--ink)' }}>★ {r.ratings?.mentorship}/5</strong></div>
                <div>Learning: <strong style={{ color: 'var(--ink)' }}>★ {r.ratings?.learning}/5</strong></div>
                <div>Work-Life: <strong style={{ color: 'var(--ink)' }}>★ {r.ratings?.work_life_balance}/5</strong></div>
                <div>Comp: <strong style={{ color: 'var(--ink)' }}>★ {r.ratings?.compensation}/5</strong></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Write Review Modal */}
      {showSubmitModal && (
        <div className="modal-backdrop">
          <div className="modal-content" style={{ maxWidth: '540px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--ink)' }}>
                Write Experience Review
              </h2>
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--ink-muted)' }}
              >
                <IconX size={20} />
              </button>
            </div>
            <p style={{ fontSize: '0.84rem', color: 'var(--ink-muted)', marginBottom: '20px' }}>
              Your feedback is saved into MongoDB and powers institutional rating aggregations.
            </p>

            <form onSubmit={handleSubmitReview} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label className="form-label">Select Company</label>
                <select
                  className="form-select"
                  style={{ width: '100%' }}
                  value={selectedCompanyId}
                  onChange={(e) => setSelectedCompanyId(e.target.value)}
                >
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="form-label">Mentorship (1-5)</label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    className="form-input"
                    style={{ width: '100%' }}
                    value={ratings.mentorship}
                    onChange={(e) => setRatings({ ...ratings, mentorship: parseInt(e.target.value) })}
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Learning & Growth (1-5)</label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    className="form-input"
                    style={{ width: '100%' }}
                    value={ratings.learning}
                    onChange={(e) => setRatings({ ...ratings, learning: parseInt(e.target.value) })}
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Work-Life Balance (1-5)</label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    className="form-input"
                    style={{ width: '100%' }}
                    value={ratings.work_life_balance}
                    onChange={(e) => setRatings({ ...ratings, work_life_balance: parseInt(e.target.value) })}
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Comp Fairness (1-5)</label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    className="form-input"
                    style={{ width: '100%' }}
                    value={ratings.compensation}
                    onChange={(e) => setRatings({ ...ratings, compensation: parseInt(e.target.value) })}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Tags (comma separated)</label>
                <input
                  type="text"
                  className="form-input"
                  style={{ width: '100%' }}
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="e.g. Great Culture, Fast Paced, High Mentorship"
                />
              </div>

              <div>
                <label className="form-label">Review Commentary</label>
                <textarea
                  className="form-textarea"
                  style={{ width: '100%' }}
                  rows="4"
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Share details about the interview process, work culture, and day-to-day work..."
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button type="button" onClick={() => setShowSubmitModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn btn-primary">
                  {submitting ? 'Saving to MongoDB...' : 'Submit Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
