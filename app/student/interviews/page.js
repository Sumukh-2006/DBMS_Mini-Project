'use client';
// app/student/interviews/page.js - Interview Schedules & Clash Detection
import React, { useEffect, useState } from 'react';

export default function StudentInterviewsPage() {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/student/interviews')
      .then((res) => res.json())
      .then((data) => {
        setInterviews(data.interviews || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Interview Schedule</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
          Scheduled technical rounds and clash warning diagnostics
        </p>
      </div>

      {loading ? (
        <div style={{ color: 'var(--text-secondary)' }}>Loading schedule...</div>
      ) : interviews.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>📅</div>
          <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>No interviews currently scheduled</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>
            When recruiters shortlist your profile and pick interview slots, they will appear here.
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {interviews.map((int) => (
            <div key={int.interview_id} className="glass-card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <span className="badge badge-interview">Round {int.round_no}</span>
                    <span className="badge badge-applied">{int.company_name}</span>
                    <span className="badge badge-shortlisted">{int.mode}</span>
                    {int.has_clash && (
                      <span className="badge badge-rejected">⚠️ Slot Conflict Detected</span>
                    )}
                  </div>

                  <h2 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#fff' }}>
                    {int.posting_title}
                  </h2>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px', marginTop: '14px', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Date & Time: </span>
                      <strong style={{ color: '#fff' }}>{new Date(int.scheduled_at).toLocaleString()}</strong>
                    </div>

                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Duration: </span>
                      <strong style={{ color: '#fff' }}>{int.duration_min} Minutes</strong>
                    </div>

                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Status: </span>
                      <strong style={{ color: '#fbbf24', textTransform: 'capitalize' }}>{int.status}</strong>
                    </div>
                  </div>

                  {int.panelists?.length > 0 && (
                    <div style={{ marginTop: '12px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Interview Panelists: {int.panelists.map((p) => p.designation).join(', ')}
                    </div>
                  )}
                </div>

                <div>
                  {int.link_or_room && (
                    <a
                      href={int.link_or_room}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-primary btn-sm"
                      style={{ minWidth: '160px', justifyContent: 'center' }}
                    >
                      Join Meeting Link →
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
