import { render, screen, fireEvent } from '@testing-library/react';
import { PaymentRails } from '../components/PaymentRails';

const mockOnSelect = jest.fn();

describe('PaymentRails', () => {
  const defaultProps = {
    amount: 100,
    onSelect: mockOnSelect,
    availableRails: ['paystack', 'mpesa', 'circle', 'solana']
  };

  beforeEach(() => {
    mockOnSelect.mockClear();
  });

  test('renders all available payment rails', () => {
    render(<PaymentRails {...defaultProps} />);

    expect(screen.getByText(/paystack/i)).toBeInTheDocument();
    expect(screen.getByText(/m-pesa/i)).toBeInTheDocument();
    expect(screen.getByText(/circle/i)).toBeInTheDocument();
    expect(screen.getByText(/solana/i)).toBeInTheDocument();
  });

  test('selects payment rail when clicked', () => {
    render(<PaymentRails {...defaultProps} />);

    fireEvent.click(screen.getByText(/paystack/i));
    expect(mockOnSelect).toHaveBeenCalledWith('paystack');
  });

  test('shows recommended rail for large amounts', () => {
    render(<PaymentRails {...defaultProps} amount={1000} />);

    expect(screen.getByText(/recommended/i)).toBeInTheDocument();
  });

  test('disables unavailable rails', () => {
    render(
      <PaymentRails 
        {...defaultProps} 
        availableRails={['paystack']}
      />
    );

    const mpesaButton = screen.getByText(/m-pesa/i).closest('button');
    expect(mpesaButton).toBeDisabled();
  });

  test('shows fees for each rail', () => {
    render(<PaymentRails {...defaultProps} />);

    expect(screen.getByText(/1.5%/)).toBeInTheDocument(); // Paystack fee
    expect(screen.getByText(/free/i)).toBeInTheDocument(); // Crypto fee
  });
});