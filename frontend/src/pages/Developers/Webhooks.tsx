import React, { useState } from 'react';
import { Plus, Play, Trash2, Settings, CheckCircle, XCircle, Clock } from 'lucide-react';

interface WebhookEndpoint {
  id: string;
  url: string;
  events: string[];
  status: 'active' | 'inactive';
  lastDelivery?: Date;
  successRate: number;
  createdAt: Date;
}

interface WebhookLog {
  id: string;
  endpointId: string;
  event: string;
  status: 'success' | 'failed' | 'pending';
  responseCode?: number;
  responseTime?: number;
  timestamp: Date;
  payload: any;
}

const mockEndpoints: WebhookEndpoint[] = [
  {
    id: '1',
    url: 'https://api.example.com/webhooks/corridor',
    events: ['payment.completed', 'payment.failed'],
    status: 'active',
    lastDelivery: new Date('2024-01-15T10:30:00Z'),
    successRate: 98.5,
    createdAt: new Date('2024-01-01T00:00:00Z')
  },
  {
    id: '2',
    url: 'https://webhook.site/test-endpoint',
    events: ['goal.completed', 'ewa.requested'],
    status: 'active',
    lastDelivery: new Date('2024-01-15T09:15:00Z'),
    successRate: 100,
    createdAt: new Date('2024-01-10T00:00:00Z')
  }
];

const mockLogs: WebhookLog[] = [
  {
    id: '1',
    endpointId: '1',
    event: 'payment.completed',
    status: 'success',
    responseCode: 200,
    responseTime: 145,
    timestamp: new Date('2024-01-15T10:30:00Z'),
    payload: {
      id: 'pay_123',
      type: 'payment.completed',
      data: {
        payment_id: 'pay_123',
        amount: 100.00,
        currency: 'USDC'
      }
    }
  },
  {
    id: '2',
    endpointId: '1',
    event: 'payment.failed',
    status: 'failed',
    responseCode: 500,
    responseTime: 5000,
    timestamp: new Date('2024-01-15T09:45:00Z'),
    payload: {
      id: 'pay_124',
      type: 'payment.failed',
      data: {
        payment_id: 'pay_124',
        error: 'Insufficient funds'
      }
    }
  }
];

const availableEvents = [
  'payment.completed',
  'payment.failed',
  'goal.completed',
  'goal.cancelled',
  'ewa.requested',
  'ewa.approved',
  'ewa.disbursed',
  'invoice.paid',
  'webhook.test'
];

export default function Webhooks() {
  const [endpoints, setEndpoints] = useState<WebhookEndpoint[]>(mockEndpoints);
  const [logs, setLogs] = useState<WebhookLog[]>(mockLogs);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedEndpoint, setSelectedEndpoint] = useState<WebhookEndpoint | null>(null);
  const [newEndpoint, setNewEndpoint] = useState({
    url: '',
    events: [] as string[]
  });

  const handleCreateEndpoint = () => {
    const endpoint: WebhookEndpoint = {
      id: Date.now().toString(),
      url: newEndpoint.url,
      events: newEndpoint.events,
      status: 'active',
      successRate: 100,
      createdAt: new Date()
    };
    setEndpoints([...endpoints, endpoint]);
    setNewEndpoint({ url: '', events: [] });
    setShowCreateForm(false);
  };

  const handleTestEndpoint = async (endpoint: WebhookEndpoint) => {
    const testLog: WebhookLog = {
      id: Date.now().toString(),
      endpointId: endpoint.id,
      event: 'webhook.test',
      status: 'pending',
      timestamp: new Date(),
      payload: {
        id: 'test_' + Date.now(),
        type: 'webhook.test',
        data: { message: 'This is a test webhook' }
      }
    };
    setLogs([testLog, ...logs]);

    // Simulate API call
    setTimeout(() => {
      const status: WebhookLog['status'] = Math.random() > 0.2 ? 'success' : 'failed';
      const updatedLog = {
        ...testLog,
        status,
        responseCode: status === 'success' ? 200 : 500,
        responseTime: Math.floor(Math.random() * 1000) + 100
      };
      setLogs(prev => prev.map(log => log.id === testLog.id ? updatedLog : log));
    }, 2000);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Webhooks</h1>
            <p className="text-gray-600">
              Manage webhook endpoints and monitor delivery logs. Test your endpoints and debug issues in real-time.
            </p>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            <span>Add Endpoint</span>
          </button>
        </div>
      </div>

      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Create Webhook Endpoint</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Endpoint URL</label>
                <input
                  type="url"
                  value={newEndpoint.url}
                  onChange={(e) => setNewEndpoint({ ...newEndpoint, url: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://your-app.com/webhooks"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Events</label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {availableEvents.map((event) => (
                    <label key={event} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={newEndpoint.events.includes(event)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewEndpoint({
                              ...newEndpoint,
                              events: [...newEndpoint.events, event]
                            });
                          } else {
                            setNewEndpoint({
                              ...newEndpoint,
                              events: newEndpoint.events.filter(e => e !== event)
                            });
                          }
                        }}
                        className="rounded"
                      />
                      <span className="text-sm text-gray-700">{event}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleCreateEndpoint}
                disabled={!newEndpoint.url || newEndpoint.events.length === 0}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-300"
              >
                Create Endpoint
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Endpoints */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Endpoints</h2>
          
          {endpoints.map((endpoint) => (
            <div
              key={endpoint.id}
              className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                selectedEndpoint?.id === endpoint.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setSelectedEndpoint(endpoint)}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <div className={`w-2 h-2 rounded-full ${
                    endpoint.status === 'active' ? 'bg-green-500' : 'bg-gray-400'
                  }`}></div>
                  <span className="font-medium text-gray-900">{endpoint.url}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTestEndpoint(endpoint);
                    }}
                    className="p-1 text-gray-400 hover:text-blue-600"
                  >
                    <Play className="w-4 h-4" />
                  </button>
                  <button className="p-1 text-gray-400 hover:text-gray-600">
                    <Settings className="w-4 h-4" />
                  </button>
                  <button className="p-1 text-gray-400 hover:text-red-600">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>{endpoint.events.length} events</span>
                <span>{endpoint.successRate}% success rate</span>
              </div>
              
              <div className="flex flex-wrap gap-1 mt-2">
                {endpoint.events.slice(0, 3).map((event) => (
                  <span key={event} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                    {event}
                  </span>
                ))}
                {endpoint.events.length > 3 && (
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                    +{endpoint.events.length - 3} more
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Logs */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Recent Deliveries</h2>
          
          <div className="space-y-2">
            {logs
              .filter(log => !selectedEndpoint || log.endpointId === selectedEndpoint.id)
              .slice(0, 10)
              .map((log) => (
                <div key={log.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(log.status)}
                      <span className="font-medium text-gray-900">{log.event}</span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {log.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  
                  {log.responseCode && (
                    <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                      <span>Status: {log.responseCode}</span>
                      <span>Response: {log.responseTime}ms</span>
                    </div>
                  )}
                  
                  <details className="text-sm">
                    <summary className="cursor-pointer text-gray-600 hover:text-gray-800">
                      View payload
                    </summary>
                    <pre className="mt-2 p-2 bg-gray-50 rounded text-xs overflow-x-auto">
                      {JSON.stringify(log.payload, null, 2)}
                    </pre>
                  </details>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
