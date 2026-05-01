import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DollarSign, RefreshCw, AlertTriangle, CreditCard } from 'lucide-react';
import { GenericPageSkeleton } from '../components/ui/Skeletons';

// Mock Auth Context - In a real app, employee_id would come from auth
const useEmployeeAuth = () => {
    const [employeeId] = useState<string>('c50e8400-e29b-41d4-a716-446655440000'); // MOCK EMPLOYEE ID
    const [isAuthenticated] = useState<boolean>(true); // MOCK AUTH
    return { employeeId, isAuthenticated };
};


export const EmployeeEwa: React.FC = () => {
    const navigate = useNavigate();
    const { employeeId, isAuthenticated } = useEmployeeAuth(); // Using mock auth
    const [loading, setLoading] = useState(true);
    const [balance, setBalance] = useState<any | null>(null);
    const [recentRequests, setRecentRequests] = useState<any[]>([]);
    const [requestAmount, setRequestAmount] = useState<number | ''>('');
    const [submittingRequest, setSubmittingRequest] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    useEffect(() => {
        if (isAuthenticated && employeeId) {
            fetchEmployeeData();
        } else if (!isAuthenticated) {
            navigate('/login'); // Redirect to login if not authenticated
        }
    }, [employeeId, isAuthenticated, navigate]);

    const fetchEmployeeData = async () => {
        setLoading(true);
        setError(null);
        try {
            // Fetch balance
            const balanceRes = await fetch(`/ewa/employees/${employeeId}/ewa/balance`);
            if (!balanceRes.ok) {
                const errData = await balanceRes.json();
                throw new Error(errData.detail || 'Failed to fetch EWA balance');
            }
            const balanceData = await balanceRes.json();
            setBalance(balanceData);

            // Fetch recent requests (mocked for now, API doesn't have employee-specific requests yet)
            // In a real scenario, you'd fetch employee-specific EWA requests
            setRecentRequests([]); // No API endpoint for this yet, so keeping it empty
            
        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred.');
            console.error('Error fetching employee EWA data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleRequestEwa = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!employeeId || requestAmount === '' || requestAmount <= 0) {
            setError('Please enter a valid amount.');
            return;
        }

        setSubmittingRequest(true);
        setError(null);
        setSuccessMessage(null);

        try {
            const requestRes = await fetch(`/ewa/employees/${employeeId}/ewa/requests`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount_requested: requestAmount }),
            });

            if (!requestRes.ok) {
                const errData = await requestRes.json();
                throw new Error(errData.detail || 'Failed to submit EWA request.');
            }

            const requestData = await requestRes.json();
            setSuccessMessage(`EWA request for $${requestData.amount_requested.toFixed(2)} submitted successfully. Status: ${requestData.status}. Disbursed: $${requestData.amount_disbursed.toFixed(2)} (Fee: $${requestData.fee_charged.toFixed(2)})`);
            setRequestAmount('');
            fetchEmployeeData(); // Refresh data
        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred.');
            console.error('Error submitting EWA request:', err);
        } finally {
            setSubmittingRequest(false);
        }
    };

    if (loading) {
        return <GenericPageSkeleton cardRows={4} />;
    }

    if (error && !balance) { // Only show full error page if no data was loaded at all
        return (
            <div className="flex items-center justify-center min-h-[400px] text-center text-red-600">
                <div className="p-6 bg-red-50 rounded-lg border border-red-200">
                    <AlertTriangle size={32} className="mx-auto mb-4" />
                    <h3 className="text-lg font-semibold">Error Loading EWA Data</h3>
                    <p className="mt-2 text-sm">{error}</p>
                    <button onClick={fetchEmployeeData} className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">Retry</button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 p-4 md:p-8 max-w-4xl mx-auto">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Your Earned Wage Access</h1>
                <p className="text-sm text-gray-500 mt-1">Access your earned wages whenever you need them.</p>
            </div>

            {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                    {error}
                </div>
            )}
            {successMessage && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-sm text-green-600">
                    {successMessage}
                </div>
            )}

            {balance && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-start justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Available to Withdraw</p>
                            <p className="text-3xl font-bold text-gray-900 mt-2">${balance.available_balance.toFixed(2)}</p>
                        </div>
                        <DollarSign className="text-green-600" size={32} />
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-start justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Earned Wages (Current Period)</p>
                            <p className="text-3xl font-bold text-gray-900 mt-2">${balance.current_earned_wages.toFixed(2)}</p>
                        </div>
                        <CreditCard className="text-blue-600" size={32} />
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-start justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Max Possible Advance</p>
                            <p className="text-3xl font-bold text-gray-900 mt-2">${balance.max_possible_advance.toFixed(2)}</p>
                        </div>
                         <RefreshCw className="text-orange-600" size={32} />
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-start justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Next Corridor</p>
                            <p className="text-xl font-bold text-gray-900 mt-2">
                                {balance.next_pay_date ? new Date(balance.next_pay_date).toLocaleDateString() : 'N/A'}
                            </p>
                        </div>
                         <RefreshCw className="text-purple-600" size={32} />
                    </div>
                </div>
            )}

            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Request Earned Wages</h2>
                <form onSubmit={handleRequestEwa} className="space-y-4">
                    <div>
                        <label htmlFor="request-amount" className="block text-sm font-medium text-gray-700 mb-1">
                            Amount to Request ($)
                        </label>
                        <input
                            type="number"
                            id="request-amount"
                            value={requestAmount}
                            onChange={(e) => setRequestAmount(parseFloat(e.target.value))}
                            min="1"
                            step="0.01"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="e.g., 100.00"
                            disabled={submittingRequest || !balance?.available_balance}
                        />
                        {balance && requestAmount > balance.available_balance && (
                            <p className="mt-1 text-sm text-red-600">Requested amount exceeds available balance.</p>
                        )}
                        {balance && (
                             <p className="mt-1 text-sm text-gray-500">You can request up to ${balance.available_balance.toFixed(2)}</p>
                        )}
                    </div>
                    <button
                        type="submit"
                        className="w-full px-4 py-2 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={submittingRequest || !balance?.available_balance || requestAmount === '' || requestAmount <= 0 || requestAmount > balance.available_balance}
                    >
                        {submittingRequest ? 'Submitting...' : 'Request Funds Now'}
                    </button>
                </form>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent EWA Requests</h2>
                {recentRequests.length === 0 ? (
                    <div className="text-center py-4 text-gray-500">
                         <CreditCard className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                        <p>No recent EWA requests.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead>
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fee</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requested On</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {recentRequests.map((request) => (
                                    <tr key={request.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${request.amount_requested.toFixed(2)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${request.fee_charged.toFixed(2)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${request.status === 'disbursed' ? 'bg-green-100 text-green-800' : request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>
                                                {request.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(request.requested_at).toLocaleDateString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};
