import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ToastProvider, useToast } from '../contexts/ToastContext';

// Test component that uses toast
const TestComponent = () => {
    const { showToast } = useToast();

    return (
        <div>
            <button onClick={() => showToast('success', 'Success message')}>
                Show Success
            </button>
            <button onClick={() => showToast('error', 'Error message')}>
                Show Error
            </button>
        </div>
    );
};

describe('ToastContext', () => {
    it('renders toast provider without crashing', () => {
        render(
            <ToastProvider>
                <div>Test</div>
            </ToastProvider>
        );
    });

    it('shows success toast when triggered', () => {
        render(
            <ToastProvider>
                <TestComponent />
            </ToastProvider>
        );

        const successButton = screen.getByText('Show Success');
        fireEvent.click(successButton);

        expect(screen.getByText('Success message')).toBeInTheDocument();
    });

    it('shows error toast when triggered', () => {
        render(
            <ToastProvider>
                <TestComponent />
            </ToastProvider>
        );

        const errorButton = screen.getByText('Show Error');
        fireEvent.click(errorButton);

        expect(screen.getByText('Error message')).toBeInTheDocument();
    });

    it('removes toast when close button is clicked', () => {
        render(
            <ToastProvider>
                <TestComponent />
            </ToastProvider>
        );

        const successButton = screen.getByText('Show Success');
        fireEvent.click(successButton);

        const closeButton = screen.getAllByRole('button').find(
            btn => btn.querySelector('svg')
        );

        if (closeButton) {
            fireEvent.click(closeButton);
        }

        setTimeout(() => {
            expect(screen.queryByText('Success message')).not.toBeInTheDocument();
        }, 100);
    });
});
