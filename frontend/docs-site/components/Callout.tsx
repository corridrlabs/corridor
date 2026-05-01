import React from 'react';

type CalloutProps = {
  type?: 'info' | 'warning' | 'error';
  children: React.ReactNode;
};

const typeStyles = {
  info: {
    bg: 'rgba(153, 69, 255, 0.1)',
    border: '#9945FF',
    icon: 'ℹ️',
  },
  warning: {
    bg: 'rgba(245, 158, 11, 0.1)',
    border: '#F59E0B',
    icon: '⚠️',
  },
  error: {
    bg: 'rgba(239, 68, 68, 0.1)',
    border: '#EF4444',
    icon: '❌',
  },
};

export function Callout({ type = 'info', children }: CalloutProps) {
  const styles = typeStyles[type];

  return (
    <div
      style={{
        background: styles.bg,
        borderLeft: `4px solid ${styles.border}`,
        padding: '1rem',
        borderRadius: '4px',
        margin: '1rem 0',
        display: 'flex',
        gap: '0.75rem',
        alignItems: 'flex-start',
      }}
    >
      <span style={{ fontSize: '1.25rem' }}>{styles.icon}</span>
      <div style={{ color: '#FFFFFF' }}>{children}</div>
    </div>
  );
}