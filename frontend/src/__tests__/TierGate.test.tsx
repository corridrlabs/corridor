import { render, screen, fireEvent } from '@testing-library/react';
import { TierGate } from '../components/TierGate';

const mockUpgrade = jest.fn();

describe('TierGate', () => {
  beforeEach(() => {
    mockUpgrade.mockClear();
  });

  test('renders children when within tier limits', () => {
    render(
      <TierGate tier="pro" usage={50} limit={100} onUpgrade={mockUpgrade}>
        <div>Protected content</div>
      </TierGate>
    );

    expect(screen.getByText('Protected content')).toBeInTheDocument();
  });

  test('shows upgrade prompt when at limit', () => {
    render(
      <TierGate tier="free" usage={10} limit={10} onUpgrade={mockUpgrade}>
        <div>Protected content</div>
      </TierGate>
    );

    expect(screen.getByText(/upgrade/i)).toBeInTheDocument();
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
  });

  test('calls onUpgrade when upgrade button clicked', () => {
    render(
      <TierGate tier="free" usage={10} limit={10} onUpgrade={mockUpgrade}>
        <div>Protected content</div>
      </TierGate>
    );

    fireEvent.click(screen.getByText(/upgrade/i));
    expect(mockUpgrade).toHaveBeenCalledWith('pro');
  });

  test('allows unlimited usage for enterprise tier', () => {
    render(
      <TierGate tier="enterprise" usage={1000} limit={-1} onUpgrade={mockUpgrade}>
        <div>Protected content</div>
      </TierGate>
    );

    expect(screen.getByText('Protected content')).toBeInTheDocument();
  });
});