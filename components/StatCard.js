// components/StatCard.js
import React from 'react';

export default function StatCard({
  label,
  value,
  subtext,
  caption,
  delta,
  icon = null,
  indicator = false,
  indicatorColor = 'red', // 'red' | 'green'
  style = {},
}) {
  const note = subtext || caption;

  const renderIcon = () => {
    if (!icon) return null;
    if (React.isValidElement(icon)) return icon;
    const IconComponent = icon;
    return <IconComponent size={18} stroke={1.75} />;
  };

  return (
    <div
      className="editorial-card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '22px 24px',
        position: 'relative',
        backgroundColor: '#ffffff',
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
        {icon && (
          <div
            style={{
              color: 'var(--ink-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {renderIcon()}
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
            marginBottom: note ? '6px' : '0',
            fontFamily: 'var(--font-mono), monospace',
          }}
        >
          {value}
        </div>
        {note && (
          <div
            style={{
              fontSize: '0.76rem',
              color: 'var(--ink-muted)',
              fontFamily: 'var(--font-mono), monospace',
              letterSpacing: '0.02em',
            }}
          >
            {note}
          </div>
        )}
      </div>
    </div>
  );
}
