'use client';
// app/admin/policies/page.js - Placement Policy Engine Configuration
import React, { useEffect, useState } from 'react';

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
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Placement Policy Configuration</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
          Tune university placement rules enforced dynamically by PostgreSQL stored procedures and triggers
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

      {loading ? (
        <div style={{ color: 'var(--text-secondary)' }}>Loading policy engine configuration...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {policies.map((p) => (
            <div key={p.key} className="glass-card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontWeight: 800, fontSize: '1.15rem', color: '#fff', fontFamily: 'var(--font-mono)' }}>
                      {p.key}
                    </span>
                    <span className="badge badge-interview" style={{ fontSize: '0.7rem' }}>
                      Active Rule
                    </span>
                  </div>

                  <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginTop: '6px', lineHeight: 1.5 }}>
                    {p.description}
                  </p>

                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                    Last Modified: {new Date(p.updated_at).toLocaleString()}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: '280px' }}>
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
                    style={{ background: '#f59e0b' }}
                  >
                    {savingKey === p.key ? 'Saving...' : 'Update Rule'}
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
