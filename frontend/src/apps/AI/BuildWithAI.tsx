import React, { useState } from 'react';
import { Wand2, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { apiClient } from '../../api/client';

interface WorkflowConfig {
    name: string;
    description: string;
    trigger: {
        type: string;
        config: Record<string, any>;
    };
    steps: Array<{
        type: string;
        name: string;
        config: Record<string, any>;
    }>;
}

const BuildWithAI: React.FC = () => {
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [workflow, setWorkflow] = useState<WorkflowConfig | null>(null);
    const [error, setError] = useState<string | null>(null);

    const generateWorkflow = async () => {
        if (!description.trim()) return;

        setLoading(true);
        setError(null);
        setWorkflow(null);

        try {
            const response = await apiClient.post('/api/ai/generate-workflow', {
                description: description.trim()
            });

            if (response.data.error) {
                setError(response.data.message || 'Failed to generate workflow');
            } else {
                setWorkflow(response.data);
            }
        } catch (err: any) {
            console.error('Workflow generation error:', err);
            setError(err.response?.data?.detail || 'Failed to generate workflow. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const examplePrompts = [
        "Send an email when a payment over KES 10,000 is received",
        "Automatically approve EWA requests under KES 5,000",
        "Create an invoice every month for subscription customers",
        "Send WhatsApp notification when invoice is paid"
    ];

    return (
        <div className="flex flex-col h-full bg-white">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
                        <Wand2 className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl font-semibold text-gray-900">Build with AI</h1>
                        <p className="text-sm text-gray-500">Generate workflows from natural language</p>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-6">
                {/* Input Section */}
                <div className="max-w-3xl mx-auto space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Describe your workflow
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Example: Send an email when a payment is received over $1000"
                            className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                        />
                    </div>

                    <button
                        onClick={generateWorkflow}
                        disabled={!description.trim() || loading}
                        className="w-full py-3 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Generating workflow...
                            </>
                        ) : (
                            <>
                                <Wand2 className="w-5 h-5" />
                                Generate Workflow
                            </>
                        )}
                    </button>

                    {/* Example Prompts */}
                    {!workflow && !error && (
                        <div>
                            <p className="text-sm text-gray-600 mb-3">Try these examples:</p>
                            <div className="space-y-2">
                                {examplePrompts.map((prompt, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setDescription(prompt)}
                                        className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm text-gray-700 transition-colors"
                                    >
                                        {prompt}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Error */}
                    {error && (
                        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-medium text-red-900">Error</p>
                                <p className="text-sm text-red-700 mt-1">{error}</p>
                            </div>
                        </div>
                    )}

                    {/* Generated Workflow */}
                    {workflow && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-green-600">
                                <CheckCircle className="w-5 h-5" />
                                <span className="font-medium">Workflow generated successfully!</span>
                            </div>

                            <div className="border border-gray-200 rounded-lg overflow-hidden">
                                {/* Workflow Header */}
                                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                                    <h3 className="font-semibold text-gray-900">{workflow.name}</h3>
                                    <p className="text-sm text-gray-600 mt-1">{workflow.description}</p>
                                </div>

                                {/* Trigger */}
                                <div className="px-4 py-3 border-b border-gray-200">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                        <span className="text-sm font-medium text-gray-700">Trigger</span>
                                    </div>
                                    <div className="ml-4 text-sm text-gray-600">
                                        <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                                            {workflow.trigger.type}
                                        </span>
                                    </div>
                                </div>

                                {/* Steps */}
                                <div className="px-4 py-3">
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                        <span className="text-sm font-medium text-gray-700">Steps</span>
                                    </div>
                                    <div className="ml-4 space-y-3">
                                        {workflow.steps.map((step, index) => (
                                            <div key={index} className="flex items-start gap-3">
                                                <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0">
                                                    {index + 1}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium text-gray-900">{step.name}</p>
                                                    <p className="text-xs text-gray-500 mt-0.5">
                                                        Type: <span className="font-mono">{step.type}</span>
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* JSON Preview */}
                                <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
                                    <details>
                                        <summary className="text-sm font-medium text-gray-700 cursor-pointer">
                                            View JSON Configuration
                                        </summary>
                                        <pre className="mt-2 text-xs bg-gray-900 text-gray-100 p-3 rounded overflow-x-auto">
                                            {JSON.stringify(workflow, null, 2)}
                                        </pre>
                                    </details>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3">
                                <button className="flex-1 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors">
                                    Save Workflow
                                </button>
                                <button
                                    onClick={() => {
                                        setWorkflow(null);
                                        setDescription('');
                                    }}
                                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    Generate Another
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BuildWithAI;
