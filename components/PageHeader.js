// components/PageHeader.js
import React from 'react';

export default function PageHeader({
  eyebrow,
  title,
  description,
  actions = null,
  showIndicator = true,
  indicatorColor = 'red', // 'red' | 'green'
  style = {},
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: '20px',
        marginBottom: '32px',
        ...style,
      }}
    >
      <div style={{ maxWidth: '780px' }}>
        {eyebrow && (
          <div
            className="mono-eyebrow"
            style={{
              marginBottom: '10px',
            }}
          >
            {showIndicator && (
              <span
                className={indicatorColor === 'green' ? 'indicator-dot-green' : 'indicator-dot'}
              />
            )}
            {eyebrow}
          </div>
        )}
        <h1
          style={{
            fontSize: 'clamp(1.8rem, 3.5vw, 2.6rem)',
            letterSpacing: '-0.03em',
            fontWeight: 700,
            lineHeight: 1.15,
            color: 'var(--ink)',
            marginBottom: description ? '10px' : '0',
          }}
        >
          {title}
        </h1>
        {description && (
          <p
            style={{
              fontSize: '0.98rem',
              color: 'var(--ink-muted)',
              lineHeight: 1.55,
            }}
          >
            {description}
          </p>
        )}
      </div>

      {actions && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            flexWrap: 'wrap',
          }}
        >
          {actions}
        </div>
      )}
    </div>
  );
}
