'use client';
// app/student/recommendations/page.js - Top-N Semantic Vector Recommendations & Explainability
import React, { useEffect, useState } from 'react';

export default function RecommendationsPage() {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [applyingId, setApplyingId] = useState(null);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const fetchRecommendations = () => {
    setLoading(true);
    fetch('/api/student/recommendations')
      .then((res) => res.json())
      .then((data) => {
        setRecommendations(data.recommendations || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const handleApply = async (postingId) => {
    try {
      setApplyingId(postingId);
      setMessage(null);
      setError(null);

      const res = await fetch('/api/student/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postingId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to apply');

      setMessage(data.message);
      fetchRecommendations();
    } catch (err) {
      setError(err.message);
    } finally {
      setApplyingId(null);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <span className="badge badge-shortlisted">Powered by pgvector HNSW + Domain Logic</span>
        </div>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>✨ AI Semantic Recommendations</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
          Matched by projecting your profile & projects into 384-dimensional vector space alongside job requirements
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

      {loading ? (
        <div style={{ color: 'var(--text-secondary)' }}>Computing vector cosine distances and hybrid scores...</div>
      ) : recommendations.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🎯</div>
          <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>No open recommendations available</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>
            Check back soon as new company postings are approved.
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {recommendations.map((r, index) => {
            const cosinePct = Math.round(parseFloat(r.semantic_similarity || 0) * 100);
            const hybridScore = Math.round(parseFloat(r.hybrid_score || 0));

            return (
              <div key={r.posting_id} className="glass-card" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '20px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                      <span className="badge badge-interview" style={{ fontWeight: 800 }}>
                        Rank #{index + 1}
                      </span>
                      <span className="badge badge-applied">{r.company_name}</span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>📍 {r.location} • {r.mode}</span>
                    </div>

                    <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#fff' }}>
                      {r.title}
                    </h2>

                    <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginTop: '8px', lineHeight: 1.5 }}>
                      {r.description}
                    </p>

                    {/* Explainable Matching Breakdown */}
                    <div style={{
                      marginTop: '16px',
                      padding: '14px',
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)'
                    }}>
                      <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
                        Explainable Skill Breakdown
                      </div>

                      {/* Matched Skills */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '0.75rem', color: '#34d399', fontWeight: 600 }}>✓ Matched:</span>
                        {r.matched_skills?.length > 0 ? (
                          r.matched_skills.map((m, i) => (
                            <span key={i} className="badge badge-accepted" style={{ fontSize: '0.72rem' }}>
                              {m.skill} (Lv {m.proficiency})
                            </span>
                          ))
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>No direct skill overlaps</span>
                        )}
                      </div>

                      {/* Missing Mandatory Skills */}
                      {r.missing_mandatory_skills?.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.75rem', color: '#f87171', fontWeight: 600 }}>⚠ Missing:</span>
                          {r.missing_mandatory_skills.map((m, i) => (
                            <span key={i} className="badge badge-rejected" style={{ fontSize: '0.72rem' }}>
                              {m.skill} (Requires Lv {m.min_level})
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Score & Action Panel */}
                  <div style={{
                    minWidth: '220px',
                    textAlign: 'right',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                    gap: '12px'
                  }}>
                    {/* Overall Match Circle / Metric */}
                    <div style={{
                      background: 'rgba(99, 102, 241, 0.1)',
                      border: '1px solid rgba(99, 102, 241, 0.3)',
                      borderRadius: 'var(--radius-lg)',
                      padding: '12px 18px',
                      textAlign: 'center',
                      width: '100%'
                    }}>
                      <div style={{ fontSize: '2rem', fontWeight: 800, color: '#818cf8', lineHeight: 1 }}>
                        {hybridScore}%
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, marginTop: '4px' }}>
                        HYBRID MATCH SCORE
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                        Vector Cosine: {cosinePct}% • Skills: {Math.round(r.skill_score)}%
                      </div>
                    </div>

                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--success)' }}>
                      ₹{parseFloat(r.stipend).toLocaleString()}
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 400 }}>/mo</span>
                    </div>

                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      Deadline: {new Date(r.deadline).toLocaleDateString()}
                    </div>

                    {r.student_stage ? (
                      <div className="badge badge-interview" style={{ padding: '8px 16px', fontSize: '0.82rem' }}>
                        Status: {r.student_stage}
                      </div>
                    ) : (
                      <button
                        onClick={() => handleApply(r.posting_id)}
                        disabled={applyingId === r.posting_id}
                        className="btn btn-primary"
                        style={{ width: '100%' }}
                      >
                        {applyingId === r.posting_id ? 'Applying...' : 'Apply Now →'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
