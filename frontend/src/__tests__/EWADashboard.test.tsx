import { render, screen, fireEvent } from '@testing-library/react';
import { EWADashboard } from '../components/EWADashboard';

const mockRequestAdvance = jest.fn();
const mockUploadPayroll = jest.fn();

jest.mock('../hooks/useEWA', () => ({
  useEWA: () => ({
    requestAdvance: mockRequestAdvance,
    uploadPayroll: mockUploadPayroll,
    loading: false
  })
}));

describe('EWADashboard', () => {
  beforeEach(() => {
    mockRequestAdvance.mockClear();
    mockUploadPayroll.mockClear();
  });

  describe('Employee View', () => {
    const employeeData = {
      role: 'employee',
      earnedAmount: 1500,
      availableAdvance: 750,
      currentAdvances: [
        { id: 'adv1', amount: 500, remaining: 200, status: 'active' }
      ]
    };

    test('shows earned amount and available advance', () => {
      render(<EWADashboard {...employeeData} />);

      expect(screen.getByText('$1,500')).toBeInTheDocument();
      expect(screen.getByText('$750')).toBeInTheDocument();
    });

    test('allows advance request within limits', () => {
      render(<EWADashboard {...employeeData} />);

      fireEvent.change(screen.getByLabelText(/request amount/i), {
        target: { value: '300' }
      });
      fireEvent.click(screen.getByText(/request advance/i));

      expect(mockRequestAdvance).toHaveBeenCalledWith(300);
    });

    test('prevents advance request over limit', () => {
      render(<EWADashboard {...employeeData} />);

      fireEvent.change(screen.getByLabelText(/request amount/i), {
        target: { value: '800' }
      });

      const requestButton = screen.getByText(/request advance/i);
      expect(requestButton).toBeDisabled();
    });

    test('shows current advances', () => {
      render(<EWADashboard {...employeeData} />);

      expect(screen.getByText('$500')).toBeInTheDocument();
      expect(screen.getByText('$200 remaining')).toBeInTheDocument();
    });
  });

  describe('Admin View', () => {
    const adminData = {
      role: 'admin',
      employees: [
        { id: 'emp1', name: 'John Doe', earnedAmount: 1500, advances: [] },
        { id: 'emp2', name: 'Jane Smith', earnedAmount: 2000, advances: [
          { amount: 500, status: 'active' }
        ]}
      ],
      totalAdvances: 15000,
      pendingRequests: 3
    };

    test('shows employee list', () => {
      render(<EWADashboard {...adminData} />);

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    test('shows total advances and pending requests', () => {
      render(<EWADashboard {...adminData} />);

      expect(screen.getByText('$15,000')).toBeInTheDocument();
      expect(screen.getByText('3 pending')).toBeInTheDocument();
    });

    test('allows payroll CSV upload', () => {
      render(<EWADashboard {...adminData} />);

      const file = new File(['employee_id,name,salary\nEMP001,John,5000'], 'payroll.csv', {
        type: 'text/csv'
      });

      const input = screen.getByLabelText(/upload payroll/i);
      fireEvent.change(input, { target: { files: [file] } });

      expect(mockUploadPayroll).toHaveBeenCalledWith(file);
    });

    test('filters employees by search', () => {
      render(<EWADashboard {...adminData} />);

      fireEvent.change(screen.getByLabelText(/search/i), {
        target: { value: 'John' }
      });

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
    });
  });
});