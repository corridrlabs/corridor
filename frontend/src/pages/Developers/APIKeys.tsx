import React, { useState } from 'react';
import { Plus, Eye, EyeOff, Copy, Trash2, BarChart3, Calendar, Key } from 'lucide-react';

interface APIKey {
  id: string;
  name: string;
  keyPrefix: string;
  tier: 'Tier 1' | 'Tier 2' | 'Tier 3';
  permissions: string[];
  createdAt: Date;
  lastUsed?: Date;
  usage: {
    requests: number;
    limit: number;
    period: string;
  };
  status: 'active' | 'inactive';
}

type Tier = APIKey['tier'];

interface UsageStats {
  totalRequests: number;
  successRate: number;
  avgResponseTime: number;
  topEndpoints: Array<{ endpoint: string; count: number }>;
}

const mockKeys: APIKey[] = [
  {
    id: '1',
    name: 'Production API Key',
    keyPrefix: 'pk_live_12345678',
    tier: 'Tier 3',
    permissions: ['payments:read', 'payments:write', 'treasury:read', 'webhooks:manage'],
    createdAt: new Date('2024-01-01'),
    lastUsed: new Date('2024-01-15T10:30:00Z'),
    usage: { requests: 8750, limit: 10000, period: 'monthly' },
    status: 'active'
  },
  {
    id: '2',
    name: 'Development Key',
    keyPrefix: 'pk_test_87654321',
    tier: 'Tier 1',
    permissions: ['payments:read', 'goals:read', 'goals:write'],
    createdAt: new Date('2024-01-10'),
    lastUsed: new Date('2024-01-14T15:20:00Z'),
    usage: { requests: 245, limit: 1000, period: 'monthly' },
    status: 'active'
  }
];

const mockStats: UsageStats = {
  totalRequests: 8995,
  successRate: 99.2,
  avgResponseTime: 145,
  topEndpoints: [
    { endpoint: '/api/payments/split', count: 3420 },
    { endpoint: '/api/goals', count: 2150 },
    { endpoint: '/api/wallets/balance', count: 1890 },
    { endpoint: '/api/ewa/requests', count: 1535 }
  ]
};

const tierLimits: Record<Tier, { requests: number; features: string[] }> = {
  'Tier 1': { requests: 1000, features: ['Basic payments', 'Social goals'] },
  'Tier 2': { requests: 5000, features: ['EWA admin', 'Advanced payments', 'Webhooks'] },
  'Tier 3': { requests: 10000, features: ['Treasury access', 'All endpoints', 'Priority support'] }
};

export default function APIKeys() {
  const [keys, setKeys] = useState<APIKey[]>(mockKeys);
  const [stats] = useState<UsageStats>(mockStats);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedKey, setSelectedKey] = useState<APIKey | null>(keys[0]);
  const [showFullKey, setShowFullKey] = useState<string | null>(null);
  const [newKey, setNewKey] = useState<{
    name: string;
    tier: Tier;
    permissions: string[];
  }>({
    name: '',
    tier: 'Tier 1',
    permissions: [] as string[]
  });

  const availablePermissions = {
    'Tier 1': ['payments:read', 'goals:read', 'goals:write', 'wallets:read'],
    'Tier 2': ['payments:write', 'ewa:read', 'ewa:write', 'webhooks:read', 'webhooks:write'],
    'Tier 3': ['treasury:read', 'treasury:write', 'admin:read', 'admin:write']
  };

  const handleCreateKey = () => {
    const key: APIKey = {
      id: Date.now().toString(),
      name: newKey.name,
      keyPrefix: `pk_${newKey.tier.toLowerCase().replace(' ', '')}_${Math.random().toString(36).substr(2, 8)}`,
      tier: newKey.tier,
      permissions: newKey.permissions,
      createdAt: new Date(),
      usage: { requests: 0, limit: tierLimits[newKey.tier].requests, period: 'monthly' },
      status: 'active'
    };
    setKeys([...keys, key]);
    setNewKey({ name: '', tier: 'Tier 1', permissions: [] });
    setShowCreateForm(false);
    setShowFullKey(key.id);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'Tier 1': return 'bg-gray-100 text-gray-800';
      case 'Tier 2': return 'bg-orange-100 text-orange-800';
      case 'Tier 3': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">API Keys</h1>
            <p className="text-gray-600">
              Manage your API keys and monitor usage. Different tiers provide access to different endpoints and features.
            </p>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            <span>Create API Key</span>
          </button>
        </div>
      </div>

      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Create API Key</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Key Name</label>
                <input
                  type="text"
                  value={newKey.name}
                  onChange={(e) => setNewKey({ ...newKey, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Production API Key"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tier</label>
                <select
                  value={newKey.tier}
                  onChange={(e) => setNewKey({ ...newKey, tier: e.target.value as Tier, permissions: [] })}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Tier 1">Tier 1 - {tierLimits['Tier 1'].requests} req/month</option>
                  <option value="Tier 2">Tier 2 - {tierLimits['Tier 2'].requests} req/month</option>
                  <option value="Tier 3">Tier 3 - {tierLimits['Tier 3'].requests} req/month</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {tierLimits[newKey.tier].features.join(', ')}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Permissions</label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {Object.entries(availablePermissions).map(([tier, permissions]) => (
                    <div key={tier}>
                      {(tier === newKey.tier || (newKey.tier === 'Tier 2' && tier === 'Tier 1') || (newKey.tier === 'Tier 3')) && (
                        <>
                          <div className="text-xs font-medium text-gray-500 mb-1">{tier}</div>
                          {permissions.map((permission) => (
                            <label key={permission} className="flex items-center space-x-2 ml-2">
                              <input
                                type="checkbox"
                                checked={newKey.permissions.includes(permission)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setNewKey({
                                      ...newKey,
                                      permissions: [...newKey.permissions, permission]
                                    });
                                  } else {
                                    setNewKey({
                                      ...newKey,
                                      permissions: newKey.permissions.filter(p => p !== permission)
                                    });
                                  }
                                }}
                                className="rounded"
                              />
                              <span className="text-sm text-gray-700">{permission}</span>
                            </label>
                          ))}
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleCreateKey}
                disabled={!newKey.name || newKey.permissions.length === 0}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300"
              >
                Create Key
              </button>
              <button
                onClick={() => setShowCreateForm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* API Keys List */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Your API Keys</h2>
          
          {keys.map((key) => (
            <div
              key={key.id}
              className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                selectedKey?.id === key.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setSelectedKey(key)}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-900">{key.name}</span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${getTierColor(key.tier)}`}>
                  {key.tier}
                </span>
              </div>
              
              <div className="flex items-center space-x-2 mb-2">
                <Key className="w-4 h-4 text-gray-400" />
                <code className="text-sm text-gray-600">{key.keyPrefix}...</code>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowFullKey(showFullKey === key.id ? null : key.id);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  {showFullKey === key.id ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    copyToClipboard(key.keyPrefix + '_full_key_here');
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>

              {showFullKey === key.id && (
                <div className="mb-2 p-2 bg-gray-100 rounded text-sm font-mono break-all">
                  {key.keyPrefix}_sk_1234567890abcdef
                </div>
              )}
              
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>{key.usage.requests}/{key.usage.limit} requests</span>
                <span>{key.lastUsed ? `Used ${key.lastUsed.toLocaleDateString()}` : 'Never used'}</span>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${(key.usage.requests / key.usage.limit) * 100}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>

        {/* Key Details & Usage Stats */}
        <div className="lg:col-span-2 space-y-6">
          {selectedKey ? (
            <>
              <div className="border rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">{selectedKey.name}</h3>
                  <div className="flex items-center space-x-2">
                    <button className="p-2 text-gray-400 hover:text-gray-600">
                      <BarChart3 className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <div className="text-sm text-gray-600">Created</div>
                    <div className="font-medium">{selectedKey.createdAt.toLocaleDateString()}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Last Used</div>
                    <div className="font-medium">
                      {selectedKey.lastUsed ? selectedKey.lastUsed.toLocaleDateString() : 'Never'}
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="text-sm text-gray-600 mb-2">Permissions</div>
                  <div className="flex flex-wrap gap-2">
                    {selectedKey.permissions.map((permission) => (
                      <span key={permission} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                        {permission}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="border rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Usage Statistics</h3>
                
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{stats.totalRequests.toLocaleString()}</div>
                    <div className="text-sm text-gray-600">Total Requests</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{stats.successRate}%</div>
                    <div className="text-sm text-gray-600">Success Rate</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{stats.avgResponseTime}ms</div>
                    <div className="text-sm text-gray-600">Avg Response</div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Top Endpoints</h4>
                  <div className="space-y-2">
                    {stats.topEndpoints.map((endpoint, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <code className="text-sm text-gray-700">{endpoint.endpoint}</code>
                        <span className="text-sm text-gray-600">{endpoint.count.toLocaleString()} calls</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="border rounded-lg p-6 text-center text-gray-500">
              <Key className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>Select an API key to view details and usage statistics</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
