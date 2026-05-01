import React, { useState } from 'react';
import { Webhook, Plus, Activity, CheckCircle, XCircle, RefreshCw } from 'lucide-react';

interface WebhookEndpoint {
    id: string;
    url: string;
    events: string[];
    status: 'active' | 'failed';
    last_delivery: string | null;
}

const Webhooks: React.FC = () => {
    const [endpoints, setEndpoints] = useState<WebhookEndpoint[]>([
        { id: '1', url: 'https://api.example.com/webhooks/corridor', events: ['payment.success', 'invoice.created'], status: 'active', last_delivery: '2023-11-27 10:30:00' },
    ]);

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Webhooks</h2>
                    <p className="text-gray-500">Configure real-time notifications for your application.</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                    <Plus className="w-4 h-4" />
                    Add Endpoint
                </button>
            </div>

            <div className="grid gap-4">
                {endpoints.map(endpoint => (
                    <div key={endpoint.id} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:border-indigo-200 transition-colors">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                                    <Webhook className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-mono text-sm font-medium text-gray-900">{endpoint.url}</h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${endpoint.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {endpoint.status === 'active' ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                            {endpoint.status.toUpperCase()}
                                        </span>
                                        <span className="text-xs text-gray-500">Last delivery: {endpoint.last_delivery || 'Never'}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Test Delivery">
                                    <Activity className="w-4 h-4" />
                                </button>
                                <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors" title="Refresh Secret">
                                    <RefreshCw className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            {endpoint.events.map(event => (
                                <span key={event} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded border border-gray-200">
                                    {event}
                                </span>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {endpoints.length === 0 && (
                <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                    <Webhook className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900">No Webhooks Configured</h3>
                    <p className="text-gray-500 mb-6">Start listening to events by adding your first endpoint.</p>
                    <button className="px-4 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors">
                        Read Documentation
                    </button>
                </div>
            )}
        </div>
    );
};

export default Webhooks;
