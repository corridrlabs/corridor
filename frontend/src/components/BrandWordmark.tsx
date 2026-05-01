import React from 'react';

interface BrandWordmarkProps {
  className?: string;
  showLeadingC?: boolean;
}

export const BrandWordmark: React.FC<BrandWordmarkProps> = ({
  className = '',
  showLeadingC = true,
}) => {
  return (
    <span className={`brand-wordmark ${className}`.trim()} aria-label="Corridor">
      {showLeadingC ? <span>C</span> : null}
      <span className="brand-coin-o" aria-hidden="true">
        <span className="brand-coin-core" />
      </span>
      <span>rridor</span>
    </span>
  );
};
