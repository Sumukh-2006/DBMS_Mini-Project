'use client';
// app/admin/policies/page.js - Placement Policy Engine Configuration
import React, { useEffect, useState } from 'react';
import PageHeader from '../../../components/PageHeader';
import {
  IconAdjustments,
  IconCheck,
  IconDeviceFloppy,
  IconHistory,
  IconScale,
} from '@tabler/icons-react';

export default function AdminPoliciesPage() {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState(null);
  const [editValues, setEditValues] = useState({});
  const [message, setMessage] = useState(null);

  const fetchPolicies = () => {
    setLoading(true);
    fetch('/api/admin/policies')
      .then((res) => res.json())
      .then((data) => {
        setPolicies(data.policies || []);
        const initial = {};
        (data.policies || []).forEach((p) => {
          initial[p.key] = p.value;
        });
        setEditValues(initial);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchPolicies();
  }, []);

  const handleUpdate = async (key) => {
    try {
      setSavingKey(key);
      setMessage(null);

      const res = await fetch('/api/admin/policies', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value: editValues[key] }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update policy');

      setMessage(data.message);
      fetchPolicies();
    } catch (err) {
      alert(err.message);
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      <PageHeader
        title="Placement Policy Configuration"
        subtitle="Tune university placement rules enforced dynamically by PostgreSQL stored procedures and triggers"
        badge={
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="live-indicator-dot" />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', letterSpacing: '0.04em' }}>
              RULE ENGINE
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
            Loading policy engine configuration...
          </span>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {policies.map((p) => (
            <div key={p.key} className="card" style={{ padding: '24px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  flexWrap: 'wrap',
                  gap: '20px',
                }}
              >
                <div style={{ flex: 1, minWidth: '280px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <span
                      style={{
                        fontWeight: 700,
                        fontSize: '1.05rem',
                        color: 'var(--ink)',
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      {p.key}
                    </span>
                    <span className="mono-badge" style={{ background: 'rgba(59, 107, 143, 0.08)', color: 'var(--slate-blue)' }}>
                      Active Rule
                    </span>
                  </div>

                  <p
                    style={{
                      fontSize: '0.88rem',
                      color: 'var(--ink-muted)',
                      marginTop: '8px',
                      lineHeight: 1.6,
                    }}
                  >
                    {p.description}
                  </p>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '0.75rem',
                      color: 'var(--ink-muted)',
                      marginTop: '12px',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    <IconHistory size={14} />
                    <span>Last Modified: {new Date(p.updated_at).toLocaleString()}</span>
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    minWidth: '280px',
                    maxWidth: '400px',
                    width: '100%',
                  }}
                >
                  <input
                    type="text"
                    className="form-input"
                    value={editValues[p.key] !== undefined ? editValues[p.key] : p.value}
                    onChange={(e) => setEditValues({ ...editValues, [p.key]: e.target.value })}
                    style={{ flex: 1, fontFamily: 'var(--font-mono)', fontWeight: 600 }}
                  />

                  <button
                    type="button"
                    onClick={() => handleUpdate(p.key)}
                    disabled={savingKey === p.key}
                    className="btn btn-primary btn-sm"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <IconDeviceFloppy size={14} />
                    <span>{savingKey === p.key ? 'Saving...' : 'Update'}</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
          {policies.length === 0 && (
            <div className="card" style={{ padding: '40px', textAlign: 'center', color: 'var(--ink-muted)' }}>
              No policy configurations discovered in database.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
