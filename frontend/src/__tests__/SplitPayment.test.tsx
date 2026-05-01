import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SplitPayment } from '../components/SplitPayment';

const mockCreateSplit = jest.fn();
const mockAddParticipant = jest.fn();

jest.mock('../hooks/useSplitPayments', () => ({
  useSplitPayments: () => ({
    createSplit: mockCreateSplit,
    addParticipant: mockAddParticipant,
    loading: false
  })
}));

describe('SplitPayment', () => {
  beforeEach(() => {
    mockCreateSplit.mockClear();
    mockAddParticipant.mockClear();
  });

  test('creates split payment with participants', async () => {
    render(<SplitPayment />);

    // Fill in amount
    fireEvent.change(screen.getByLabelText(/amount/i), {
      target: { value: '100' }
    });

    // Add participants
    fireEvent.change(screen.getByLabelText(/add participant/i), {
      target: { value: 'user@example.com' }
    });
    fireEvent.click(screen.getByText(/add/i));

    // Create split
    fireEvent.click(screen.getByText(/create split/i));

    await waitFor(() => {
      expect(mockCreateSplit).toHaveBeenCalledWith({
        amount: 100,
        participants: ['user@example.com']
      });
    });
  });

  test('shows participant list', () => {
    render(
      <SplitPayment 
        initialParticipants={['user1@example.com', 'user2@example.com']}
      />
    );

    expect(screen.getByText('user1@example.com')).toBeInTheDocument();
    expect(screen.getByText('user2@example.com')).toBeInTheDocument();
  });

  test('removes participant when delete clicked', () => {
    render(
      <SplitPayment 
        initialParticipants={['user1@example.com', 'user2@example.com']}
      />
    );

    const deleteButtons = screen.getAllByText(/remove/i);
    fireEvent.click(deleteButtons[0]);

    expect(screen.queryByText('user1@example.com')).not.toBeInTheDocument();
  });

  test('calculates per-person amount', () => {
    render(<SplitPayment />);

    fireEvent.change(screen.getByLabelText(/amount/i), {
      target: { value: '120' }
    });

    // Add 3 participants
    ['user1@example.com', 'user2@example.com', 'user3@example.com'].forEach(email => {
      fireEvent.change(screen.getByLabelText(/add participant/i), {
        target: { value: email }
      });
      fireEvent.click(screen.getByText(/add/i));
    });

    expect(screen.getByText('$40.00 per person')).toBeInTheDocument();
  });

  test('shows payment progress', () => {
    const splitData = {
      id: 'split1',
      amount: 120,
      participants: ['user1', 'user2', 'user3'],
      payments: [
        { userId: 'user1', amount: 40, paid: true },
        { userId: 'user2', amount: 40, paid: false },
        { userId: 'user3', amount: 40, paid: false }
      ]
    };

    render(<SplitPayment splitData={splitData} />);

    expect(screen.getByText('1 of 3 paid')).toBeInTheDocument();
    expect(screen.getByText('$40 collected')).toBeInTheDocument();
  });
});