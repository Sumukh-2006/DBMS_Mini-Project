// components/PageHeader.js
import React from 'react';

export default function PageHeader({
  eyebrow,
  title,
  description,
  subtitle,
  actions = null,
  action = null,
  showIndicator = true,
  indicatorColor = 'red', // 'red' | 'green'
  style = {},
}) {
  const desc = description || subtitle;
  const acts = actions || action;

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
            marginBottom: desc ? '10px' : '0',
          }}
        >
          {title}
        </h1>
        {desc && (
          <p
            style={{
              fontSize: '0.98rem',
              color: 'var(--ink-muted)',
              lineHeight: 1.55,
            }}
          >
            {desc}
          </p>
        )}
      </div>

      {acts && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            flexWrap: 'wrap',
          }}
        >
          {acts}
        </div>
      )}
    </div>
  );
}
