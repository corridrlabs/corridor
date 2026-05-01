import React, { useState } from 'react';
import { Link, Settings, CheckCircle, AlertCircle } from 'lucide-react';

interface ERPSystem {
  id: string;
  name: string;
  logo: string;
  description: string;
  connected: boolean;
  webhookUrl?: string;
}

export default function ERPIntegration() {
  const [systems] = useState<ERPSystem[]>([
    {
      id: 'workday',
      name: 'Workday',
      logo: '🏢',
      description: 'Enterprise HR and payroll system',
      connected: false
    },
    {
      id: 'bamboohr',
      name: 'BambooHR',
      logo: '🎋',
      description: 'HR management for small to medium businesses',
      connected: false
    },
    {
      id: 'adp',
      name: 'ADP',
      logo: '📊',
      description: 'Payroll and HR services',
      connected: false
    },
    {
      id: 'sap',
      name: 'SAP SuccessFactors',
      logo: '⚡',
      description: 'Enterprise cloud HR suite',
      connected: false
    }
  ]);

  const [selectedSystem, setSelectedSystem] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);

  const connectSystem = async (systemId: string) => {
    setConnecting(true);
    setSelectedSystem(systemId);

    try {
      // Simulate OAuth flow
      const authUrl = `/api/ewa/integrations/${systemId}/auth`;
      window.open(authUrl, 'erp-auth', 'width=600,height=600');
      
      // In real implementation, listen for OAuth callback
      setTimeout(() => {
        alert(`${systems.find(s => s.id === systemId)?.name} connected successfully!`);
        setConnecting(false);
        setSelectedSystem(null);
      }, 2000);
    } catch (error) {
      alert('Connection failed');
      setConnecting(false);
      setSelectedSystem(null);
    }
  };

  const generateWebhookUrl = (systemId: string) => {
    return `${window.location.origin}/api/ewa/webhooks/${systemId}`;
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">ERP System Integration</h1>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Link className="text-blue-600" size={20} />
          <h3 className="font-semibold text-blue-800">Integration Benefits</h3>
        </div>
        <ul className="text-blue-700 space-y-1">
          <li>• Automatic employee data synchronization</li>
          <li>• Real-time attendance tracking</li>
          <li>• Seamless payroll integration</li>
          <li>• Reduced manual data entry</li>
        </ul>
      </div>

      {/* Available Systems */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {systems.map((system) => (
          <div key={system.id} className="bg-white p-6 rounded-lg shadow border">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{system.logo}</span>
                <div>
                  <h3 className="font-semibold">{system.name}</h3>
                  <p className="text-sm text-gray-600">{system.description}</p>
                </div>
              </div>
              {system.connected ? (
                <CheckCircle className="text-green-600" size={24} />
              ) : (
                <AlertCircle className="text-gray-400" size={24} />
              )}
            </div>

            {system.connected ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle size={16} />
                  <span className="text-sm">Connected and syncing</span>
                </div>
                <button className="w-full bg-red-600 text-white py-2 rounded hover:bg-red-700">
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                onClick={() => connectSystem(system.id)}
                disabled={connecting && selectedSystem === system.id}
                className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
              >
                {connecting && selectedSystem === system.id ? 'Connecting...' : 'Connect'}
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Manual Webhook Setup */}
      <div className="bg-white p-6 rounded-lg shadow border">
        <div className="flex items-center gap-2 mb-4">
          <Settings size={20} />
          <h2 className="text-xl font-semibold">Manual Webhook Setup</h2>
        </div>
        
        <p className="text-gray-600 mb-4">
          If your ERP system supports webhooks, configure these URLs to sync data automatically:
        </p>

        <div className="space-y-4">
          {systems.map((system) => (
            <div key={system.id} className="border rounded p-4">
              <h4 className="font-medium mb-2">{system.name} Webhook URL</h4>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={generateWebhookUrl(system.id)}
                  readOnly
                  className="flex-1 bg-gray-50 border rounded px-3 py-2 text-sm"
                />
                <button
                  onClick={() => navigator.clipboard.writeText(generateWebhookUrl(system.id))}
                  className="bg-gray-600 text-white px-3 py-2 rounded text-sm hover:bg-gray-700"
                >
                  Copy
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Configure this URL in your {system.name} webhook settings
              </p>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
          <h4 className="font-medium text-yellow-800 mb-2">Webhook Events</h4>
          <p className="text-sm text-yellow-700">
            Configure your ERP system to send these events:
          </p>
          <ul className="text-sm text-yellow-700 mt-2 space-y-1">
            <li>• <code>employee_updated</code> - When employee data changes</li>
            <li>• <code>attendance_updated</code> - When attendance is recorded</li>
            <li>• <code>payroll_processed</code> - When payroll is run</li>
          </ul>
        </div>
      </div>
    </div>
  );
}