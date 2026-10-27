// components/EmptyState.js
import React from 'react';

export default function EmptyState({
  icon: Icon = null,
  title = 'No Data Found',
  description = 'There are no active items to display for this view.',
  action = null,
  style = {},
}) {
  return (
    <div
      className="editorial-card"
      style={{
        textAlign: 'center',
        padding: '56px 24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        ...style,
      }}
    >
      {Icon && (
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            backgroundColor: 'var(--surface-subtle)',
            border: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px',
            color: 'var(--ink-muted)',
          }}
        >
          <Icon size={22} stroke={1.5} />
        </div>
      )}
      <div
        className="mono-eyebrow"
        style={{
          marginBottom: '8px',
        }}
      >
        {title}
      </div>
      <p
        style={{
          fontSize: '0.92rem',
          color: 'var(--ink-muted)',
          maxWidth: '420px',
          margin: '0 auto',
          lineHeight: 1.5,
          marginBottom: action ? '20px' : '0',
        }}
      >
        {description}
      </p>
      {action && <div>{action}</div>}
    </div>
  );
}
