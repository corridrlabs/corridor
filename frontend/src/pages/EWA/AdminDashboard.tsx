import React, { useState, useEffect } from 'react';
import { Upload, Users, DollarSign, TrendingUp, Download } from 'lucide-react';

interface DashboardStats {
  total_employees: number;
  active_advances: number;
  total_advanced: number;
  total_repaid: number;
  outstanding: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [advanceLimit, setAdvanceLimit] = useState(50);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch('/api/ewa/dashboard?org_id=current');
      const data = await response.json();
      setStats(data.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateAdvanceLimit = async () => {
    try {
      await fetch('/api/ewa/advance-limit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ org_id: 'current', advance_limit: advanceLimit })
      });
      alert('Advance limit updated successfully');
    } catch (error) {
      alert('Failed to update advance limit');
    }
  };

  const exportReport = () => {
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const endDate = new Date().toISOString().split('T')[0];
    window.open(`/api/ewa/export?org_id=current&start_date=${startDate}&end_date=${endDate}`);
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">EWA Admin Dashboard</h1>
        <button
          onClick={exportReport}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <Download size={20} />
          Export Report
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Employees</p>
              <p className="text-2xl font-bold">{stats?.total_employees || 0}</p>
            </div>
            <Users className="text-blue-600" size={32} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Advances</p>
              <p className="text-2xl font-bold">{stats?.active_advances || 0}</p>
            </div>
            <TrendingUp className="text-green-600" size={32} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div>
            <p className="text-sm text-gray-600">Total Advanced</p>
            <p className="text-2xl font-bold">${stats?.total_advanced?.toFixed(2) || '0.00'}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <div>
            <p className="text-sm text-gray-600">Outstanding</p>
            <p className="text-2xl font-bold text-orange-600">${stats?.outstanding?.toFixed(2) || '0.00'}</p>
          </div>
        </div>
      </div>

      {/* Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow border">
          <h2 className="text-xl font-semibold mb-4">Advance Settings</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Maximum Advance Percentage
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={advanceLimit}
                  onChange={(e) => setAdvanceLimit(Number(e.target.value))}
                  className="border rounded px-3 py-2 w-20"
                  min="1"
                  max="100"
                />
                <span>%</span>
                <button
                  onClick={updateAdvanceLimit}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Update
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Employees can advance up to {advanceLimit}% of their earned wages
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow border">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <button
              onClick={() => window.location.href = '/ewa/import'}
              className="w-full flex items-center gap-2 bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700"
            >
              <Upload size={20} />
              Import Employees
            </button>
            <button
              onClick={() => window.location.href = '/ewa/history'}
              className="w-full flex items-center gap-2 bg-gray-600 text-white px-4 py-3 rounded-lg hover:bg-gray-700"
            >
              <DollarSign size={20} />
              View All Advances
            </button>
            <button
              onClick={() => window.location.href = '/ewa/integrations'}
              className="w-full flex items-center gap-2 bg-purple-600 text-white px-4 py-3 rounded-lg hover:bg-purple-700"
            >
              Connect ERP System
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}