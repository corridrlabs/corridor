import React, { useState, useEffect } from 'react';
import { DollarSign, Clock, CreditCard, History } from 'lucide-react';

interface EarningsData {
  earned_amount: number;
  advance_limit: number;
  max_advance: number;
  outstanding: number;
  available_advance: number;
}

interface Advance {
  id: string;
  amount: number;
  status: string;
  requested_at: string;
  repaid_at?: string;
}

export default function EmployeePortal() {
  const [earnings, setEarnings] = useState<EarningsData | null>(null);
  const [advances, setAdvances] = useState<Advance[]>([]);
  const [requestAmount, setRequestAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);

  const employeeId = 'current'; // Get from auth context

  useEffect(() => {
    fetchEarnings();
    fetchHistory();
  }, []);

  const fetchEarnings = async () => {
    try {
      const response = await fetch(`/api/ewa/employee/earnings?employee_id=${employeeId}`);
      const data = await response.json();
      setEarnings(data.data);
    } catch (error) {
      console.error('Failed to fetch earnings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const response = await fetch(`/api/ewa/employee/history?employee_id=${employeeId}`);
      const data = await response.json();
      setAdvances(data.data || []);
    } catch (error) {
      console.error('Failed to fetch history:', error);
    }
  };

  const requestAdvance = async () => {
    if (!requestAmount || parseFloat(requestAmount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    setRequesting(true);
    try {
      const response = await fetch('/api/ewa/employee/request-advance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_id: employeeId,
          amount: parseFloat(requestAmount)
        })
      });

      if (response.ok) {
        alert('Advance requested successfully!');
        setRequestAmount('');
        fetchEarnings();
        fetchHistory();
      } else {
        const error = await response.text();
        alert(`Failed to request advance: ${error}`);
      }
    } catch (error) {
      alert('Failed to request advance');
    } finally {
      setRequesting(false);
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">My Earned Wages</h1>

      {/* Earnings Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Earned This Period</p>
              <p className="text-2xl font-bold text-green-600">
                ${earnings?.earned_amount?.toFixed(2) || '0.00'}
              </p>
            </div>
            <DollarSign className="text-green-600" size={32} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Available to Advance</p>
              <p className="text-2xl font-bold text-blue-600">
                ${earnings?.available_advance?.toFixed(2) || '0.00'}
              </p>
            </div>
            <CreditCard className="text-blue-600" size={32} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Outstanding</p>
              <p className="text-2xl font-bold text-orange-600">
                ${earnings?.outstanding?.toFixed(2) || '0.00'}
              </p>
            </div>
            <Clock className="text-orange-600" size={32} />
          </div>
        </div>
      </div>

      {/* Request Advance */}
      <div className="bg-white p-6 rounded-lg shadow border mb-8">
        <h2 className="text-xl font-semibold mb-4">Request Advance</h2>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <input
              type="number"
              value={requestAmount}
              onChange={(e) => setRequestAmount(e.target.value)}
              placeholder="Enter amount"
              className="w-full border rounded px-3 py-2"
              max={earnings?.available_advance || 0}
              step="0.01"
            />
            <p className="text-sm text-gray-600 mt-1">
              Maximum: ${earnings?.available_advance?.toFixed(2) || '0.00'} 
              ({earnings?.advance_limit || 0}% of earned wages)
            </p>
          </div>
          <button
            onClick={requestAdvance}
            disabled={requesting || !earnings?.available_advance || earnings.available_advance <= 0}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
          >
            {requesting ? 'Requesting...' : 'Request Advance'}
          </button>
        </div>
      </div>

      {/* Advance History */}
      <div className="bg-white p-6 rounded-lg shadow border">
        <div className="flex items-center gap-2 mb-4">
          <History size={20} />
          <h2 className="text-xl font-semibold">Advance History</h2>
        </div>
        
        {advances.length === 0 ? (
          <p className="text-gray-600">No advances requested yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Amount</th>
                  <th className="text-left py-2">Status</th>
                  <th className="text-left py-2">Requested</th>
                  <th className="text-left py-2">Repaid</th>
                </tr>
              </thead>
              <tbody>
                {advances.map((advance) => (
                  <tr key={advance.id} className="border-b">
                    <td className="py-2">${advance.amount.toFixed(2)}</td>
                    <td className="py-2">
                      <span className={`px-2 py-1 rounded text-sm ${
                        advance.status === 'repaid' 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {advance.status}
                      </span>
                    </td>
                    <td className="py-2">
                      {new Date(advance.requested_at).toLocaleDateString()}
                    </td>
                    <td className="py-2">
                      {advance.repaid_at 
                        ? new Date(advance.repaid_at).toLocaleDateString()
                        : '-'
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}