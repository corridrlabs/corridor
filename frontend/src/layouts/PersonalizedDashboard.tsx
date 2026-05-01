import React, { useEffect, useState } from 'react';

interface DashboardConfig {
  layout: string;
  enabled_features: string[];
  default_view: string;
  custom_widgets: string[];
}

interface FeatureAccess {
  ewa: boolean;
  social_payments: boolean;
  payroll: boolean;
  invoicing: boolean;
  treasury: boolean;
  api_keys: boolean;
  analytics: boolean;
}

const PersonalizedDashboard: React.FC = () => {
  const [config, setConfig] = useState<DashboardConfig | null>(null);
  const [features, setFeatures] = useState<FeatureAccess | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardConfig();
  }, []);

  const fetchDashboardConfig = async () => {
    try {
      const [configRes, featuresRes] = await Promise.all([
        fetch('/api/dashboard/config', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch('/api/dashboard/features', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        })
      ]);

      if (configRes.ok && featuresRes.ok) {
        setConfig(await configRes.json());
        setFeatures(await featuresRes.json());
      }
    } catch (error) {
      console.error('Failed to fetch dashboard config:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your personalized dashboard...</p>
        </div>
      </div>
    );
  }

  const renderEWADashboard = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Employee Management</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">0</div>
            <div className="text-sm text-gray-600">Total Employees</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">0</div>
            <div className="text-sm text-gray-600">Active Advances</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">$0</div>
            <div className="text-sm text-gray-600">Outstanding</div>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Advance Requests</h3>
        <p className="text-gray-500">No advance requests yet</p>
      </div>
    </div>
  );

  const renderSocialDashboard = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Active Goals</h2>
        <p className="text-gray-500">No active goals yet</p>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Split Payments</h3>
        <p className="text-gray-500">No split payments yet</p>
      </div>
    </div>
  );

  const renderDeveloperDashboard = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">API Usage</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">0</div>
            <div className="text-sm text-gray-600">Requests Today</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">0</div>
            <div className="text-sm text-gray-600">Active Keys</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">100%</div>
            <div className="text-sm text-gray-600">Uptime</div>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
        <div className="space-y-2">
          <a href="/docs" className="block text-blue-600 hover:underline">API Documentation</a>
          <a href="/api-keys" className="block text-blue-600 hover:underline">Manage API Keys</a>
          <a href="/webhooks" className="block text-blue-600 hover:underline">Webhook Settings</a>
        </div>
      </div>
    </div>
  );

  const renderFullDashboard = () => (
    <div className="space-y-6">
      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-2">Wallet Balance</h3>
          <div className="text-2xl font-bold text-green-600">$0.00</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-2">This Month</h3>
          <div className="text-2xl font-bold text-blue-600">$0.00</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-2">Pending</h3>
          <div className="text-2xl font-bold text-orange-600">$0.00</div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Transactions</h3>
        <p className="text-gray-500">No transactions yet</p>
      </div>
    </div>
  );

  const renderDashboard = () => {
    if (!config) return null;

    switch (config.layout) {
      case 'ewa_focused':
        return renderEWADashboard();
      case 'social_focused':
        return renderSocialDashboard();
      case 'developer_focused':
        return renderDeveloperDashboard();
      default:
        return renderFullDashboard();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600">{config?.layout.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
            </div>
            <div className="flex space-x-4">
              {features?.ewa && (
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                  EWA
                </button>
              )}
              {features?.social_payments && (
                <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
                  Social
                </button>
              )}
              {features?.api_keys && (
                <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700">
                  API
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderDashboard()}
      </div>
    </div>
  );
};

export default PersonalizedDashboard;