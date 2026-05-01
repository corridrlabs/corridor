import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        if (error?.message?.includes('A listener indicated an asynchronous response by returning true, but the message channel closed before a response was received')) {
            return { hasError: false, error: null };
        }
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        if (error?.message?.includes('A listener indicated an asynchronous response by returning true, but the message channel closed before a response was received')) {
            return;
        }
        console.error('Uncaught error:', error, errorInfo);
        // Here you would log to Sentry
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
                    <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
                        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h2>
                        <p className="text-gray-600 mb-6">
                            We apologize for the inconvenience. The application encountered an unexpected error.
                        </p>

                        {/* Specific help for deployment issues */}
                        {this.state.error?.message.includes('VITE_API_URL') && (
                            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg text-left">
                                <h3 className="text-sm font-bold text-amber-800 mb-1">Configuration Required</h3>
                                <p className="text-xs text-amber-700">
                                    The application is missing a required environment variable: <code className="bg-amber-100 px-1 rounded">VITE_API_URL</code>.
                                    Please ensure this is set in your Vercel Project Settings.
                                </p>
                            </div>
                        )}

                        <div className="flex justify-center gap-4">
                            <button
                                onClick={() => window.location.reload()}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors shadow-sm"
                            >
                                Reload Page
                            </button>
                            <button
                                onClick={() => window.location.href = '/'}
                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                            >
                                Go Home
                            </button>
                        </div>

                        <div className="mt-8 text-left border-t pt-6">
                            <details className="cursor-pointer group">
                                <summary className="text-sm text-gray-500 font-medium hover:text-gray-700">Technical Details / Diagnostics</summary>
                                <div className="mt-4 space-y-4">
                                    <div className="bg-gray-100 p-4 rounded overflow-auto max-h-48">
                                        <pre className="text-xs text-gray-800">
                                            {this.state.error?.toString()}
                                            {"\n\n"}
                                            {this.state.error?.stack}
                                        </pre>
                                    </div>
                                    <div className="text-xs text-gray-400">
                                        <strong>Environment:</strong> {process.env.NODE_ENV} |
                                        <strong> Origin:</strong> {window.location.origin}
                                    </div>
                                </div>
                            </details>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
