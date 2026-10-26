'use client';
// app/admin/audit-logs/page.js - Immutable Audit Log Inspector
import React, { useEffect, useState } from 'react';

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [entityFilter, setEntityFilter] = useState('');

  const fetchLogs = (entity) => {
    setLoading(true);
    let url = '/api/admin/audit-logs';
    if (entity) url += `?entity=${entity}`;

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        setLogs(data.auditLogs || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchLogs(entityFilter);
  }, [entityFilter]);

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <span className="badge badge-interview">Append-Only • Protected by trg_history_immutable Trigger</span>
        </div>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Tamper-Evident Audit Logs</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
          Chronological historical records of state transitions, offer acceptances, and policy executions
        </p>
      </div>

      {/* Filter Bar */}
      <div className="glass-card" style={{ padding: '16px 20px', marginBottom: '24px', display: 'flex', gap: '16px', alignItems: 'center' }}>
        <label className="form-label" style={{ marginBottom: 0 }}>Filter by Entity:</label>
        <select
          className="form-select"
          style={{ maxWidth: '240px' }}
          value={entityFilter}
          onChange={(e) => setEntityFilter(e.target.value)}
        >
          <option value="">All Entities</option>
          <option value="application">Application</option>
          <option value="offer">Offer</option>
          <option value="company">Company</option>
          <option value="policy_config">Policy Config</option>
          <option value="internship_posting">Internship Posting</option>
        </select>
      </div>

      {/* Logs Table */}
      {loading ? (
        <div style={{ color: 'var(--text-secondary)' }}>Loading audit trail...</div>
      ) : logs.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>📜</div>
          <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>No audit logs recorded for this filter</div>
        </div>
      ) : (
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Timestamp</th>
                <th>Actor</th>
                <th>Action</th>
                <th>Entity</th>
                <th>Payload / Details (JSONB)</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.audit_id}>
                  <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                    #{log.audit_id}
                  </td>
                  <td style={{ fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: '#fff' }}>{log.actor_email || 'System Action'}</div>
                    {log.actor_role && (
                      <span className="badge badge-applied" style={{ fontSize: '0.68rem', marginTop: '2px' }}>
                        {log.actor_role}
                      </span>
                    )}
                  </td>
                  <td>
                    <span className="badge badge-interview" style={{ fontSize: '0.72rem' }}>
                      {log.action}
                    </span>
                  </td>
                  <td>
                    <strong style={{ color: '#a5b4fc', fontFamily: 'var(--font-mono)' }}>{log.entity}</strong>
                    {log.entity_id && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}> (id: {log.entity_id})</span>
                    )}
                  </td>
                  <td style={{ maxWidth: '320px' }}>
                    <pre style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.75rem',
                      color: 'var(--text-secondary)',
                      background: 'rgba(0,0,0,0.25)',
                      padding: '6px 10px',
                      borderRadius: '4px',
                      overflowX: 'auto'
                    }}>
                      {typeof log.details === 'object' ? JSON.stringify(log.details) : log.details}
                    </pre>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
