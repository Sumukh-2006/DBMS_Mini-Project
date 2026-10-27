'use client';

import React, { useEffect, useState } from 'react';
import PageHeader from '../../../components/PageHeader';
import EmptyState from '../../../components/EmptyState';
import {
  IconSparkles,
  IconMapPin,
  IconCheck,
  IconAlertCircle,
  IconClock,
  IconArrowRight,
} from '@tabler/icons-react';

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      <PageHeader
        eyebrow="Semantic Embedding Engine • pgvector HNSW"
        title="AI Recommendations"
        subtitle="Matched by projecting your verified profile, projects, and skills into 384-dimensional vector space alongside job requirements"
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
            <IconSparkles size={14} color="var(--accent-secondary)" />
            <span>Cosine Distance + Skill Graph</span>
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
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ height: '160px', background: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }} />
          ))}
        </div>
      ) : recommendations.length === 0 ? (
        <EmptyState
          icon={<IconSparkles size={28} />}
          title="No recommendations currently available"
          description="Update your resume and profile skills to generate personalized cosine similarity recommendations."
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {recommendations.map((r, index) => {
            const cosinePct = Math.round(parseFloat(r.semantic_similarity || 0) * 100);
            const hybridScore = Math.round(parseFloat(r.hybrid_score || 0));

            return (
              <div
                key={r.posting_id}
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
                {/* Left Description & Explainability */}
                <div style={{ flex: 1, minWidth: '320px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono), monospace',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '3px 10px',
                        borderRadius: '999px',
                        backgroundColor: 'var(--ink)',
                        color: '#ffffff',
                      }}
                    >
                      RANK #{index + 1}
                    </span>
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
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '0.78rem',
                        color: 'var(--ink-muted)',
                      }}
                    >
                      <IconMapPin size={13} /> {r.location} • {r.mode}
                    </span>
                  </div>

                  <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--ink)', margin: 0 }}>
                    {r.title}
                  </h2>

                  <p
                    style={{
                      fontSize: '0.86rem',
                      color: 'var(--ink-muted)',
                      marginTop: '8px',
                      lineHeight: 1.5,
                      maxWidth: '720px',
                    }}
                  >
                    {r.description}
                  </p>

                  {/* Explainable Skill Breakdown Box */}
                  <div
                    style={{
                      marginTop: '16px',
                      padding: '14px 16px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--surface-subtle)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    <div
                      style={{
                        fontFamily: 'var(--font-mono), monospace',
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        color: 'var(--ink-muted)',
                        marginBottom: '8px',
                      }}
                    >
                      Explainable Match Diagnostics
                    </div>

                    {/* Matched Skills */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontFamily: 'var(--font-mono), monospace', fontSize: '0.72rem', color: '#047857', fontWeight: 600 }}>
                        ✓ Matched:
                      </span>
                      {r.matched_skills?.length > 0 ? (
                        r.matched_skills.map((m, i) => (
                          <span
                            key={i}
                            style={{
                              fontFamily: 'var(--font-mono), monospace',
                              fontSize: '0.7rem',
                              padding: '2px 8px',
                              borderRadius: '999px',
                              backgroundColor: 'rgba(16, 185, 129, 0.08)',
                              color: '#047857',
                              border: '1px solid rgba(16, 185, 129, 0.25)',
                              fontWeight: 600,
                            }}
                          >
                            {m.skill} (Lv {m.proficiency})
                          </span>
                        ))
                      ) : (
                        <span style={{ fontSize: '0.74rem', color: 'var(--ink-muted)' }}>No direct skill overlaps</span>
                      )}
                    </div>

                    {/* Missing Mandatory Skills */}
                    {r.missing_mandatory_skills?.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
                        <span style={{ fontFamily: 'var(--font-mono), monospace', fontSize: '0.72rem', color: 'var(--accent)', fontWeight: 600 }}>
                          ⚠ Missing:
                        </span>
                        {r.missing_mandatory_skills.map((m, i) => (
                          <span
                            key={i}
                            style={{
                              fontFamily: 'var(--font-mono), monospace',
                              fontSize: '0.7rem',
                              padding: '2px 8px',
                              borderRadius: '999px',
                              backgroundColor: 'rgba(217, 45, 32, 0.08)',
                              color: 'var(--accent)',
                              border: '1px solid rgba(217, 45, 32, 0.2)',
                              fontWeight: 600,
                            }}
                          >
                            {m.skill} (Requires Lv {m.min_level})
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Score & Action Panel */}
                <div
                  style={{
                    minWidth: '220px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                    gap: '12px',
                    textAlign: 'right',
                  }}
                >
                  {/* Hybrid Match Indicator Pill */}
                  <div
                    style={{
                      width: '100%',
                      padding: '14px 18px',
                      borderRadius: 'var(--radius-lg)',
                      backgroundColor: 'var(--surface-subtle)',
                      border: '1px solid var(--border)',
                      textAlign: 'center',
                    }}
                  >
                    <div
                      style={{
                        fontFamily: 'var(--font-mono), monospace',
                        fontSize: '2rem',
                        fontWeight: 700,
                        color: 'var(--ink)',
                        lineHeight: 1,
                      }}
                    >
                      {hybridScore}%
                    </div>
                    <div
                      style={{
                        fontFamily: 'var(--font-mono), monospace',
                        fontSize: '0.66rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        color: 'var(--ink-muted)',
                        marginTop: '4px',
                      }}
                    >
                      Hybrid Match Score
                    </div>
                    <div
                      style={{
                        fontFamily: 'var(--font-mono), monospace',
                        fontSize: '0.68rem',
                        color: 'var(--ink-muted)',
                        marginTop: '3px',
                      }}
                    >
                      Vector: {cosinePct}% • Skills: {Math.round(r.skill_score)}%
                    </div>
                  </div>

                  <div>
                    <div
                      style={{
                        fontFamily: 'var(--font-mono), monospace',
                        fontSize: '1.4rem',
                        fontWeight: 700,
                        color: 'var(--ink)',
                      }}
                    >
                      ₹{parseFloat(r.stipend).toLocaleString()}
                      <span style={{ fontSize: '0.74rem', color: 'var(--ink-muted)', fontWeight: 400 }}> /mo</span>
                    </div>
                  </div>

                  <div
                    style={{
                      fontFamily: 'var(--font-mono), monospace',
                      fontSize: '0.74rem',
                      color: 'var(--ink-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}
                  >
                    <IconClock size={14} /> Deadline: {new Date(r.deadline).toLocaleDateString()}
                  </div>

                  <div style={{ width: '100%', marginTop: '6px' }}>
                    {r.student_stage ? (
                      <div
                        style={{
                          fontFamily: 'var(--font-mono), monospace',
                          fontSize: '0.74rem',
                          fontWeight: 600,
                          padding: '8px 16px',
                          borderRadius: '999px',
                          backgroundColor: 'var(--surface-subtle)',
                          border: '1px solid var(--border)',
                          color: 'var(--ink)',
                          textAlign: 'center',
                        }}
                      >
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
