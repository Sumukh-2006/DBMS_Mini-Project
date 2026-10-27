// components/StatCard.js
import React from 'react';

export default function StatCard({
  label,
  value,
  subtext,
  icon: Icon = null,
  indicator = false,
  indicatorColor = 'red', // 'red' | 'green'
  style = {},
}) {
  return (
    <div
      className="editorial-card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '22px 24px',
        position: 'relative',
        ...style,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '14px',
        }}
      >
        <div
          className="mono-eyebrow"
          style={{
            fontSize: '0.7rem',
          }}
        >
          {indicator && (
            <span
              className={indicatorColor === 'green' ? 'indicator-dot-green' : 'indicator-dot'}
            />
          )}
          {label}
        </div>
        {Icon && (
          <div
            style={{
              color: 'var(--ink-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon size={18} stroke={1.75} />
          </div>
        )}
      </div>

      <div>
        <div
          style={{
            fontSize: '2.1rem',
            fontWeight: 700,
            letterSpacing: '-0.03em',
            lineHeight: 1,
            color: 'var(--ink)',
            marginBottom: subtext ? '6px' : '0',
          }}
        >
          {value}
        </div>
        {subtext && (
          <div
            style={{
              fontSize: '0.78rem',
              color: 'var(--ink-muted)',
              fontFamily: 'var(--font-mono), monospace',
              letterSpacing: '0.02em',
            }}
          >
            {subtext}
          </div>
        )}
      </div>
    </div>
  );
}
