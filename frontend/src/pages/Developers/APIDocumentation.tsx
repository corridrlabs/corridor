import React, { useMemo, useState } from 'react';
import { Code, Play, Copy, Check, ArrowRight } from 'lucide-react';
import api from '../../services/api';
import { API_BASE_URL, APP_BASE_URL } from '../../config/env';

interface APIEndpoint {
  method: string;
  path: string;
  description: string;
  tier: string;
  requestBody?: Record<string, unknown>;
  responses: Record<string, string>;
}

const endpoints: APIEndpoint[] = [
  {
    method: 'POST',
    path: '/api/social/goals',
    description: 'Create a social goal and generate a share link',
    tier: 'All Tiers',
    requestBody: {
      title: 'Launch Campaign',
      description: 'Collect funds for a product launch',
      target_amount: 1000,
      currency: 'USDC'
    },
    responses: { '200': 'Goal created' }
  },
  {
    method: 'GET',
    path: '/api/social/goals',
    description: 'List social goals for the authenticated account',
    tier: 'All Tiers',
    responses: { '200': 'Goals list' }
  },
  {
    method: 'GET',
    path: '/api/wallets',
    description: 'Fetch wallets and balances',
    tier: 'All Tiers',
    responses: { '200': 'Wallet list' }
  },
  {
    method: 'POST',
    path: '/api/api-keys',
    description: 'Create a partner API key',
    tier: 'All Tiers',
    requestBody: {
      name: 'Production Key',
      is_live: true
    },
    responses: { '200': 'API key created' }
  },
  {
    method: 'GET',
    path: '/api/webhooks',
    description: 'List webhook endpoints',
    tier: 'All Tiers',
    responses: { '200': 'Webhooks list' }
  },
  {
    method: 'POST',
    path: '/api/webhooks',
    description: 'Register a webhook endpoint',
    tier: 'All Tiers',
    requestBody: {
      url: 'https://yourapp.com/corridor/webhooks',
      events: ['payment.success', 'payment.failed']
    },
    responses: { '200': 'Webhook created' }
  },
];

export default function APIDocumentation() {
  const [selectedEndpoint, setSelectedEndpoint] = useState<APIEndpoint | null>(null);
  const [copied, setCopied] = useState(false);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; payload: unknown } | null>(null);
  const docsBaseUrl = API_BASE_URL || APP_BASE_URL || '';
  const developersDocsUrl = `${APP_BASE_URL || ''}/docs/developers`;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const curlCommand = useMemo(() => {
    if (!selectedEndpoint) return '';
    const body = selectedEndpoint.requestBody
      ? ` \\\n  -H "Content-Type: application/json" \\\n  -d '${JSON.stringify(selectedEndpoint.requestBody)}'`
      : '';
    return `curl -X ${selectedEndpoint.method} "${docsBaseUrl}${selectedEndpoint.path}" \\\n  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"${body}`;
  }, [docsBaseUrl, selectedEndpoint]);

  const handleTryOut = async () => {
    if (!selectedEndpoint) return;
    setRunning(true);
    setResult(null);
    try {
      const localPath = selectedEndpoint.path.replace(/^\/api/, '');
      const response = await api.request({
        url: localPath,
        method: selectedEndpoint.method as 'GET' | 'POST',
        data: selectedEndpoint.requestBody,
      });
      setResult({ ok: true, payload: response.data });
    } catch (error: any) {
      setResult({
        ok: false,
        payload: error?.response?.data || error?.message || 'Request failed',
      });
    } finally {
      setRunning(false);
    }
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return 'bg-green-100 text-green-800';
      case 'POST': return 'bg-blue-100 text-blue-800';
      case 'PUT': return 'bg-yellow-100 text-yellow-800';
      case 'DELETE': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTierColor = (tier: string) => {
    if (tier.includes('Tier 3')) return 'bg-purple-100 text-purple-800';
    if (tier.includes('Tier 2')) return 'bg-orange-100 text-orange-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">API Documentation</h1>
        <p className="text-gray-600">
          Interactive API explorer for Corridor's payment infrastructure. Test endpoints, view responses, and generate code samples.
        </p>
        <div className="mt-4 inline-flex items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm text-indigo-800">
          Need AI-agent integration?
          <a href={developersDocsUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-medium underline">
            Open MCP Guide
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Endpoint List */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Endpoints</h2>
          
          {endpoints.map((endpoint, index) => (
            <div
              key={index}
              className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                selectedEndpoint === endpoint ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setSelectedEndpoint(endpoint)}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getMethodColor(endpoint.method)}`}>
                    {endpoint.method}
                  </span>
                  <code className="text-sm font-mono text-gray-800">{endpoint.path}</code>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${getTierColor(endpoint.tier)}`}>
                  {endpoint.tier}
                </span>
              </div>
              <p className="text-sm text-gray-600">{endpoint.description}</p>
            </div>
          ))}
        </div>

        {/* Endpoint Details */}
        <div className="space-y-6">
          {selectedEndpoint ? (
            <>
              <div className="border rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {selectedEndpoint.method} {selectedEndpoint.path}
                  </h3>
                  <button
                    onClick={() => copyToClipboard(curlCommand)}
                    className="flex items-center space-x-2 px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>Copy cURL</span>
                  </button>
                </div>

                <p className="text-gray-600 mb-4">{selectedEndpoint.description}</p>

                {selectedEndpoint.requestBody && (
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-900 mb-2">Request Body</h4>
                    <pre className="bg-gray-50 p-3 rounded text-sm overflow-x-auto">
                      <code>{JSON.stringify(selectedEndpoint.requestBody, null, 2)}</code>
                    </pre>
                  </div>
                )}

                <div className="mb-4">
                  <h4 className="font-medium text-gray-900 mb-2">Response</h4>
                  <div className="space-y-2">
                    {Object.entries(selectedEndpoint.responses).map(([code, description]) => (
                      <div key={code} className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          code.startsWith('2') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {code}
                        </span>
                        <span className="text-sm text-gray-600">{description}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleTryOut}
                  disabled={running}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-60"
                >
                  <Play className="w-4 h-4" />
                  <span>{running ? 'Running...' : 'Try it out'}</span>
                </button>
                {result && (
                  <div className={`mt-4 rounded p-3 text-sm ${result.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    <pre className="overflow-x-auto">
                      <code>{JSON.stringify(result.payload, null, 2)}</code>
                    </pre>
                  </div>
                )}
              </div>

              <div className="border rounded-lg p-6">
                <h4 className="font-medium text-gray-900 mb-3">Code Examples</h4>
                <div className="space-y-4">
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-2">JavaScript</h5>
                    <pre className="bg-gray-50 p-3 rounded text-sm overflow-x-auto">
                      <code>{`const response = await fetch('${docsBaseUrl}${selectedEndpoint.path}', {
  method: '${selectedEndpoint.method}',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_ACCESS_TOKEN'
  },${selectedEndpoint.requestBody ? `
  body: JSON.stringify(${JSON.stringify(selectedEndpoint.requestBody, null, 2)})` : ''}
});`}</code>
                    </pre>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="border rounded-lg p-6 text-center text-gray-500">
              <Code className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>Select an endpoint to view details and test it</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
