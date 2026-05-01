import React, { useState, Children } from 'react';

type TabItem = {
  label: string;
  value: string;
};

type TabsProps = {
  items: string[];
  children: React.ReactNode;
};

type TabPanelProps = {
  children: React.ReactNode;
};

export function Tabs({ items, children }: TabsProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const childArray = Children.toArray(children) as React.ReactElement[];

  return (
    <div style={{ margin: '1rem 0' }}>
      <div
        style={{
          display: 'flex',
          gap: '0',
          borderBottom: '1px solid #222222',
          marginBottom: '0.5rem',
        }}
      >
        {items.map((label, index) => (
          <button
            key={label}
            onClick={() => setActiveIndex(index)}
            style={{
              padding: '0.5rem 1rem',
              background: 'transparent',
              border: 'none',
              borderBottom:
                index === activeIndex
                  ? '2px solid #9945FF'
                  : '2px solid transparent',
              color: index === activeIndex ? '#FFFFFF' : '#888888',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: 500,
              transition: 'all 0.2s',
            }}
          >
            {label}
          </button>
        ))}
      </div>
      <div>{childArray[activeIndex]}</div>
    </div>
  );
}

export function Tab({ children }: TabPanelProps) {
  return <>{children}</>;
}