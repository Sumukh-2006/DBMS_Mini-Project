'use client';
// app/admin/audit-logs/page.js - Immutable Audit Log Inspector
import React, { useEffect, useState } from 'react';
import PageHeader from '../../../components/PageHeader';
import StatusBadge from '../../../components/StatusBadge';
import EmptyState from '../../../components/EmptyState';
import {
  IconFileText,
  IconFilter,
  IconShieldLock,
  IconUser,
  IconClock,
} from '@tabler/icons-react';

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      <PageHeader
        title="Tamper-Evident Audit Logs"
        subtitle="Chronological historical records of state transitions, offer acceptances, and policy executions"
        badge={
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="live-indicator-dot" />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', letterSpacing: '0.04em' }}>
              IMMUTABLE • TRG_HISTORY_IMMUTABLE
            </span>
          </div>
        }
      />

      {/* Filter Bar */}
      <div
        className="card"
        style={{
          padding: '16px 20px',
          display: 'flex',
          gap: '16px',
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <IconFilter size={18} color="var(--ink-muted)" />
          <label className="form-label" style={{ marginBottom: 0, fontWeight: 600 }}>
            Filter by Entity:
          </label>
        </div>
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
        <span style={{ fontSize: '0.78rem', color: 'var(--ink-muted)', fontFamily: 'var(--font-mono)' }}>
          Showing {logs.length} logged event{logs.length === 1 ? '' : 's'}
        </span>
      </div>

      {/* Logs Table */}
      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '60px 0', justifyContent: 'center' }}>
          <span className="live-indicator-dot" />
          <span style={{ color: 'var(--ink-muted)', fontSize: '0.9rem', fontFamily: 'var(--font-mono)' }}>
            Loading audit trail...
          </span>
        </div>
      ) : logs.length === 0 ? (
        <div className="card" style={{ padding: '60px 24px' }}>
          <EmptyState
            icon={IconFileText}
            title="No audit events found"
            description="No system or user actions match the selected entity filter."
          />
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
                  <td>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.78rem',
                        color: 'var(--ink-muted)',
                      }}
                    >
                      #{log.audit_id}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.8rem', whiteSpace: 'nowrap', fontFamily: 'var(--font-mono)' }}>
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--ink)', fontSize: '0.88rem' }}>
                      {log.actor_email || 'System Action'}
                    </div>
                    {log.actor_role && (
                      <span
                        className="mono-badge"
                        style={{
                          fontSize: '0.65rem',
                          marginTop: '3px',
                          display: 'inline-block',
                          textTransform: 'uppercase',
                        }}
                      >
                        {log.actor_role}
                      </span>
                    )}
                  </td>
                  <td>
                    <StatusBadge status="interview" label={log.action} />
                  </td>
                  <td>
                    <strong style={{ color: 'var(--slate-blue)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
                      {log.entity}
                    </strong>
                    {log.entity_id && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--ink-muted)', fontFamily: 'var(--font-mono)' }}>
                        {' '}(id: {log.entity_id})
                      </span>
                    )}
                  </td>
                  <td style={{ maxWidth: '360px' }}>
                    <pre
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.72rem',
                        color: 'var(--ink)',
                        background: 'var(--surface-subtle)',
                        border: '1px solid var(--border)',
                        padding: '6px 10px',
                        borderRadius: '6px',
                        overflowX: 'auto',
                        margin: 0,
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-all',
                      }}
                    >
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
