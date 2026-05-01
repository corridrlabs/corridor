import React from 'react';
import Link from 'next/link';

type CardProps = {
  title: string;
  href: string;
  icon?: string;
  children?: React.ReactNode;
};

export function Card({ title, href, icon, children }: CardProps) {
  return (
    <Link
      href={href}
      style={{
        display: 'block',
        background: '#111111',
        border: '1px solid #222222',
        borderRadius: '8px',
        padding: '1.5rem',
        textDecoration: 'none',
        transition: 'all 0.2s ease',
        cursor: 'pointer',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
        {icon && <span style={{ fontSize: '1.5rem' }}>{icon}</span>}
        <h3 style={{ color: '#FFFFFF', fontSize: '1.125rem', fontWeight: 600, margin: 0 }}>
          {title}
        </h3>
      </div>
      {children && (
        <p style={{ color: '#888888', fontSize: '0.875rem', margin: 0 }}>
          {children}
        </p>
      )}
    </Link>
  );
}

type CardGridProps = {
  children: React.ReactNode;
};

export function CardGrid({ children }: CardGridProps) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '1rem',
        margin: '1.5rem 0',
      }}
    >
      {children}
    </div>
  );
}