// components/StatusBadge.js
import React from 'react';

const STAGE_STYLES = {
  Applied: {
    bg: 'rgba(59, 107, 143, 0.08)',
    color: '#2b5470',
    border: '1px solid rgba(59, 107, 143, 0.2)',
    dot: '#3b6b8f',
  },
  Shortlisted: {
    bg: 'rgba(147, 51, 234, 0.08)',
    color: '#7e22ce',
    border: '1px solid rgba(147, 51, 234, 0.2)',
    dot: '#9333ea',
  },
  Interview: {
    bg: 'rgba(217, 119, 6, 0.08)',
    color: '#b45309',
    border: '1px solid rgba(217, 119, 6, 0.25)',
    dot: '#d97706',
  },
  Offered: {
    bg: 'rgba(219, 39, 119, 0.08)',
    color: '#be185d',
    border: '1px solid rgba(219, 39, 119, 0.2)',
    dot: '#db2777',
  },
  Accepted: {
    bg: '#0a0a0a',
    color: '#ffffff',
    border: '1px solid #0a0a0a',
    dot: '#16a34a',
  },
  Rejected: {
    bg: 'rgba(217, 45, 32, 0.08)',
    color: '#b91c1c',
    border: '1px solid rgba(217, 45, 32, 0.2)',
    dot: '#d92d20',
  },
  Withdrawn: {
    bg: '#ebeae8',
    color: '#5b6070',
    border: '1px solid rgba(10, 10, 10, 0.08)',
    dot: '#73726f',
  },
  // Posting status
  open: {
    bg: 'rgba(22, 163, 74, 0.08)',
    color: '#15803d',
    border: '1px solid rgba(22, 163, 74, 0.2)',
    dot: '#16a34a',
  },
  closed: {
    bg: '#ebeae8',
    color: '#5b6070',
    border: '1px solid rgba(10, 10, 10, 0.08)',
    dot: '#73726f',
  },
  pending: {
    bg: 'rgba(217, 119, 6, 0.08)',
    color: '#b45309',
    border: '1px solid rgba(217, 119, 6, 0.25)',
    dot: '#d97706',
  },
  accepted_offer: {
    bg: '#0a0a0a',
    color: '#ffffff',
    border: '1px solid #0a0a0a',
    dot: '#16a34a',
  },
  declined: {
    bg: 'rgba(217, 45, 32, 0.08)',
    color: '#b91c1c',
    border: '1px solid rgba(217, 45, 32, 0.2)',
    dot: '#d92d20',
  },
  expired: {
    bg: '#ebeae8',
    color: '#73726f',
    border: '1px solid rgba(10, 10, 10, 0.08)',
    dot: '#a8a7a4',
  },
};

export default function StatusBadge({ status, style = {} }) {
  const normKey = status ? String(status) : 'Withdrawn';
  const conf = STAGE_STYLES[normKey] || STAGE_STYLES[normKey.toLowerCase()] || STAGE_STYLES.Withdrawn;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '3px 10px',
        borderRadius: '999px',
        fontFamily: 'var(--font-mono), monospace',
        fontSize: '0.7rem',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        backgroundColor: conf.bg,
        color: conf.color,
        border: conf.border,
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      <span
        style={{
          width: '5px',
          height: '5px',
          borderRadius: '50%',
          backgroundColor: conf.dot,
        }}
      />
      {status}
    </span>
  );
}
