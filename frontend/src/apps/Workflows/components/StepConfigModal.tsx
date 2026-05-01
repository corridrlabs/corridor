import React, { useState, useEffect } from 'react';
import { X, Save, CreditCard, Mail, Globe, Clock, Code, Database, Split } from 'lucide-react';

// Placeholder components for specific forms - will be implemented individually
const PaymentConfigForm = ({ config, onChange }: any) => (
    <div className="space-y-4">
        <div>
            <label className="block text-sm font-medium text-gray-700">Provider</label>
            <select
                value={config.provider || 'paystack'}
                onChange={e => onChange({ ...config, provider: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
                <option value="paystack">Paystack</option>
                <option value="flutterwave">Flutterwave</option>
                <option value="mpesa">M-Pesa</option>
            </select>
        </div>
        <div>
            <label className="block text-sm font-medium text-gray-700">Amount</label>
            <input
                type="number"
                value={config.amount || ''}
                onChange={e => onChange({ ...config, amount: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
        </div>
        <div>
            <label className="block text-sm font-medium text-gray-700">Currency</label>
            <select
                value={config.currency || 'KES'}
                onChange={e => onChange({ ...config, currency: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
                <option value="KES">KES</option>
                <option value="USD">USD</option>
                <option value="NGN">NGN</option>
            </select>
        </div>
    </div>
);

const EmailConfigForm = ({ config, onChange }: any) => (
    <div className="space-y-4">
        <div>
            <label className="block text-sm font-medium text-gray-700">Recipient</label>
            <input
                type="text"
                value={config.recipient || ''}
                onChange={e => onChange({ ...config, recipient: e.target.value })}
                placeholder="{{customer.email}}"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
        </div>
        <div>
            <label className="block text-sm font-medium text-gray-700">Subject</label>
            <input
                type="text"
                value={config.subject || ''}
                onChange={e => onChange({ ...config, subject: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
        </div>
        <div>
            <label className="block text-sm font-medium text-gray-700">Body</label>
            <textarea
                value={config.body || ''}
                onChange={e => onChange({ ...config, body: e.target.value })}
                rows={4}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
        </div>
    </div>
);

const WebhookConfigForm = ({ config, onChange }: any) => (
    <div className="space-y-4">
        <div>
            <label className="block text-sm font-medium text-gray-700">URL</label>
            <input
                type="text"
                value={config.url || ''}
                onChange={e => onChange({ ...config, url: e.target.value })}
                placeholder="https://api.example.com/webhook"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
        </div>
        <div>
            <label className="block text-sm font-medium text-gray-700">Method</label>
            <select
                value={config.method || 'POST'}
                onChange={e => onChange({ ...config, method: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
            </select>
        </div>
        <div>
            <label className="block text-sm font-medium text-gray-700">Headers (JSON)</label>
            <textarea
                value={config.headers || '{}'}
                onChange={e => onChange({ ...config, headers: e.target.value })}
                rows={2}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm font-mono"
            />
        </div>
    </div>
);

const ConditionConfigForm = ({ config, onChange }: any) => (
    <div className="space-y-4">
        <div>
            <label className="block text-sm font-medium text-gray-700">Variable</label>
            <input
                type="text"
                value={config.variable || ''}
                onChange={e => onChange({ ...config, variable: e.target.value })}
                placeholder="amount"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
        </div>
        <div>
            <label className="block text-sm font-medium text-gray-700">Operator</label>
            <select
                value={config.operator || 'equals'}
                onChange={e => onChange({ ...config, operator: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
                <option value="equals">Equals</option>
                <option value="not_equals">Not Equals</option>
                <option value="greater_than">Greater Than</option>
                <option value="less_than">Less Than</option>
                <option value="contains">Contains</option>
            </select>
        </div>
        <div>
            <label className="block text-sm font-medium text-gray-700">Value</label>
            <input
                type="text"
                value={config.value || ''}
                onChange={e => onChange({ ...config, value: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
        </div>
    </div>
);

const DelayConfigForm = ({ config, onChange }: any) => (
    <div className="space-y-4">
        <div>
            <label className="block text-sm font-medium text-gray-700">Duration</label>
            <div className="flex gap-2">
                <input
                    type="number"
                    value={config.duration || 1}
                    onChange={e => onChange({ ...config, duration: parseInt(e.target.value) })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                />
                <select
                    value={config.unit || 'minutes'}
                    onChange={e => onChange({ ...config, unit: e.target.value })}
                    className="mt-1 block w-32 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                    <option value="seconds">Seconds</option>
                    <option value="minutes">Minutes</option>
                    <option value="hours">Hours</option>
                    <option value="days">Days</option>
                </select>
            </div>
        </div>
    </div>
);

const APICallConfigForm = ({ config, onChange }: any) => (
    <div className="space-y-4">
        <WebhookConfigForm config={config} onChange={onChange} />
    </div>
);

const DataTransformConfigForm = ({ config, onChange }: any) => (
    <div className="space-y-4">
        <div>
            <label className="block text-sm font-medium text-gray-700">Transformation Script (JS)</label>
            <textarea
                value={config.script || ''}
                onChange={e => onChange({ ...config, script: e.target.value })}
                rows={6}
                placeholder="return data.map(item => ({ ...item, processed: true }));"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm font-mono"
            />
        </div>
    </div>
);

interface StepConfigModalProps {
    node: any;
    onSave: (nodeId: string, data: any) => void;
    onCancel: () => void;
}

const StepConfigModal: React.FC<StepConfigModalProps> = ({ node, onSave, onCancel }) => {
    const [label, setLabel] = useState(node.data.label || '');
    const [description, setDescription] = useState(node.data.description || '');
    const [stepType, setStepType] = useState(node.data.stepType || 'payment');
    const [config, setConfig] = useState(node.data.config || {});

    // Determine available step types based on node type
    const isTrigger = node.type === 'trigger';
    const isLogic = node.type === 'logic';

    const handleSave = () => {
        onSave(node.id, {
            ...node.data,
            label,
            description,
            stepType,
            config
        });
    };

    const renderConfigForm = () => {
        switch (stepType) {
            case 'payment':
                return <PaymentConfigForm config={config} onChange={setConfig} />;
            case 'email':
                return <EmailConfigForm config={config} onChange={setConfig} />;
            case 'webhook':
                return <WebhookConfigForm config={config} onChange={setConfig} />;
            case 'condition':
                return <ConditionConfigForm config={config} onChange={setConfig} />;
            case 'delay':
                return <DelayConfigForm config={config} onChange={setConfig} />;
            case 'api_call':
                return <APICallConfigForm config={config} onChange={setConfig} />;
            case 'transform':
                return <DataTransformConfigForm config={config} onChange={setConfig} />;
            default:
                return <div className="text-gray-500 italic">No configuration available for this step type.</div>;
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={onCancel}></div>

                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                                Configure Step
                            </h3>
                            <button onClick={onCancel} className="text-gray-400 hover:text-gray-500">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* Basic Info */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Step Name</label>
                                <input
                                    type="text"
                                    value={label}
                                    onChange={e => setLabel(e.target.value)}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                />
                            </div>

                            {/* Step Type Selection (only for actions) */}
                            {!isTrigger && !isLogic && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Action Type</label>
                                    <div className="mt-1 grid grid-cols-3 gap-2">
                                        {[
                                            { id: 'payment', icon: CreditCard, label: 'Payment' },
                                            { id: 'email', icon: Mail, label: 'Email' },
                                            { id: 'webhook', icon: Globe, label: 'Webhook' },
                                            { id: 'delay', icon: Clock, label: 'Delay' },
                                            { id: 'api_call', icon: Code, label: 'API Call' },
                                            { id: 'transform', icon: Database, label: 'Transform' },
                                        ].map(type => (
                                            <button
                                                key={type.id}
                                                onClick={() => setStepType(type.id)}
                                                className={`flex flex-col items-center justify-center p-2 rounded-md border text-xs font-medium ${stepType === type.id
                                                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                                                        : 'border-gray-200 hover:bg-gray-50 text-gray-600'
                                                    }`}
                                            >
                                                <type.icon className="w-5 h-5 mb-1" />
                                                {type.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Logic Type Selection (only for logic) */}
                            {isLogic && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Logic Type</label>
                                    <div className="mt-1 grid grid-cols-2 gap-2">
                                        {[
                                            { id: 'condition', icon: Split, label: 'Condition' },
                                            // Add more logic types here if needed
                                        ].map(type => (
                                            <button
                                                key={type.id}
                                                onClick={() => setStepType(type.id)}
                                                className={`flex flex-col items-center justify-center p-2 rounded-md border text-xs font-medium ${stepType === type.id
                                                        ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                                                        : 'border-gray-200 hover:bg-gray-50 text-gray-600'
                                                    }`}
                                            >
                                                <type.icon className="w-5 h-5 mb-1" />
                                                {type.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="border-t border-gray-200 pt-4">
                                <h4 className="text-sm font-medium text-gray-900 mb-3">Configuration</h4>
                                {renderConfigForm()}
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                        <button
                            type="button"
                            onClick={handleSave}
                            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
                        >
                            <Save className="w-4 h-4 mr-2" />
                            Save Changes
                        </button>
                        <button
                            type="button"
                            onClick={onCancel}
                            className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StepConfigModal;
