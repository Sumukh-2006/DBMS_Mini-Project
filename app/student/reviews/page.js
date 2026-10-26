'use client';
// app/student/reviews/page.js - Post-Internship Experience Reviews
import React, { useEffect, useState } from 'react';

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
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Company Experience Reviews</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
            Transparent reviews and ratings from PES alumni stored in MongoDB document collections
          </p>
        </div>

        <button onClick={() => setShowSubmitModal(true)} className="btn btn-primary">
          + Write a Review
        </button>
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
        <div style={{ color: 'var(--text-secondary)' }}>Loading reviews...</div>
      ) : reviews.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>💬</div>
          <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>No reviews submitted yet</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>
            Be the first student to share your internship experience!
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {reviews.map((r, i) => (
            <div key={i} className="glass-card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                    <span className="badge badge-applied">{r.company_name}</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      By {r.student_name} • {new Date(r.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <p style={{ fontSize: '0.95rem', color: '#f3f4f6', lineHeight: 1.5, marginTop: '10px' }}>
                    "{r.text}"
                  </p>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '14px' }}>
                    {r.tags?.map((t, idx) => (
                      <span key={idx} className="badge badge-shortlisted" style={{ fontSize: '0.72rem' }}>
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Ratings Breakdown Grid */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '8px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                  fontSize: '0.78rem'
                }}>
                  <div>Mentorship: <strong style={{ color: '#fbbf24' }}>★ {r.ratings?.mentorship}/5</strong></div>
                  <div>Learning: <strong style={{ color: '#fbbf24' }}>★ {r.ratings?.learning}/5</strong></div>
                  <div>Work-Life: <strong style={{ color: '#fbbf24' }}>★ {r.ratings?.work_life_balance}/5</strong></div>
                  <div>Stipend/Comp: <strong style={{ color: '#fbbf24' }}>★ {r.ratings?.compensation}/5</strong></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Write Review Modal */}
      {showSubmitModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '8px' }}>Submit Internship Experience Review</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              Your feedback is saved into MongoDB and powers institutional rating aggregations.
            </p>

            <form onSubmit={handleSubmitReview}>
              <div className="form-group">
                <label className="form-label">Select Company</label>
                <select
                  className="form-select"
                  value={selectedCompanyId}
                  onChange={(e) => setSelectedCompanyId(e.target.value)}
                >
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Mentorship (1-5)</label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    className="form-input"
                    value={ratings.mentorship}
                    onChange={(e) => setRatings({ ...ratings, mentorship: parseInt(e.target.value) })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Learning & Growth (1-5)</label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    className="form-input"
                    value={ratings.learning}
                    onChange={(e) => setRatings({ ...ratings, learning: parseInt(e.target.value) })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Work-Life Balance (1-5)</label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    className="form-input"
                    value={ratings.work_life_balance}
                    onChange={(e) => setRatings({ ...ratings, work_life_balance: parseInt(e.target.value) })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Compensation Fairness (1-5)</label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    className="form-input"
                    value={ratings.compensation}
                    onChange={(e) => setRatings({ ...ratings, compensation: parseInt(e.target.value) })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Tags (comma separated)</label>
                <input
                  type="text"
                  className="form-input"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="e.g. Great Culture, Fast Paced, High Mentorship"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Review Commentary</label>
                <textarea
                  className="form-textarea"
                  rows="4"
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Share details about the interview process, work culture, and day-to-day work..."
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
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
