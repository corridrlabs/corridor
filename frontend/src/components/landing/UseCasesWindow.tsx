import React, { useState, useEffect } from 'react';
import { Search, ThumbsUp, Plus, ArrowRight, Check } from 'lucide-react';
import { withApiPath } from '../../config/env';

interface UseCase {
    id: string;
    title: string;
    description: string;
    category: string;
    votes: number;
}

export const UseCasesWindow: React.FC = () => {
    const [useCases, setUseCases] = useState<UseCase[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({ title: '', description: '', category: 'General', submitted_by: '' });
    const [submitStatus, setSubmitStatus] = useState<'idle' | 'submitting' | 'success'>('idle');

    // Predefined example use cases
    const exampleUseCases: UseCase[] = [
        {
            id: 'example-1',
            title: 'Automated Employee Onboarding',
            description: 'Streamline new hire processes with automated document collection, account creation, and training scheduling.',
            category: 'HR',
            votes: 142
        },
        {
            id: 'example-2',
            title: 'Invoice Processing & Approval',
            description: 'Automate invoice receipt, validation, approval workflows, and payment scheduling with multi-level authorization.',
            category: 'Finance',
            votes: 128
        },
        {
            id: 'example-3',
            title: 'Sales Lead Qualification',
            description: 'Automatically score and route leads based on engagement, company size, and behavior patterns.',
            category: 'Sales',
            votes: 95
        },
        {
            id: 'example-4',
            title: 'Payroll Processing with EWA',
            description: 'Process monthly payroll with integrated Early Wage Access for employees, using smart contracts on Solana.',
            category: 'Finance',
            votes: 87
        },
        {
            id: 'example-5',
            title: 'Customer Support Ticket Routing',
            description: 'Intelligently route support tickets to the right team based on issue type, priority, and agent expertise.',
            category: 'Operations',
            votes: 76
        },
        {
            id: 'example-6',
            title: 'Expense Report Automation',
            description: 'Capture receipts via mobile, auto-categorize expenses, and route for approval based on company policies.',
            category: 'Finance',
            votes: 68
        },
        {
            id: 'example-7',
            title: 'Freelancer Payment Management',
            description: 'Track project milestones, generate invoices, and process crypto payments to international contractors.',
            category: 'Crypto',
            votes: 54
        },
        {
            id: 'example-8',
            title: 'Inventory Reorder Automation',
            description: 'Monitor stock levels and automatically create purchase orders when inventory falls below threshold.',
            category: 'Operations',
            votes: 49
        }
    ];

    useEffect(() => {
        fetchUseCases();
    }, []);

    const fetchUseCases = async () => {
        try {
            const res = await fetch(withApiPath('/v1/use-cases/'));
            if (res.ok) {
                const data = await res.json();
                setUseCases(data);
            }
        } catch (error) {
            console.error('Failed to fetch use cases', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitStatus('submitting');
        try {
            const res = await fetch(withApiPath('/v1/use-cases/'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                setSubmitStatus('success');
                fetchUseCases();
                setTimeout(() => {
                    setShowForm(false);
                    setSubmitStatus('idle');
                    setFormData({ title: '', description: '', category: 'General', submitted_by: '' });
                }, 2000);
            }
        } catch (error) {
            console.error('Failed to submit use case', error);
            setSubmitStatus('idle');
        }
    };

    const handleVote = async (id: string) => {
        // Optimistic update
        setUseCases(prev => prev.map(uc => uc.id === id ? { ...uc, votes: uc.votes + 1 } : uc));

        try {
            await fetch(withApiPath(`/v1/use-cases/${id}/vote`), {
                method: 'POST'
            });
        } catch (error) {
            console.error('Failed to vote', error);
        }
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Community Use Cases</h2>
                    <p className="text-gray-600">Discover how others are using Corridor or suggest your own.</p>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="px-4 py-2 bg-black text-white rounded-lg flex items-center gap-2 hover:bg-gray-800 transition-colors"
                >
                    {showForm ? 'Cancel' : <><Plus size={18} /> Suggest Use Case</>}
                </button>
            </div>

            {showForm && (
                <div className="mb-8 bg-gray-50 p-6 rounded-xl border border-gray-200 animate-in slide-in-from-top-4">
                    {submitStatus === 'success' ? (
                        <div className="text-center py-8">
                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Check className="text-green-600" size={24} />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900">Suggestion Submitted!</h3>
                            <p className="text-gray-600">Thanks for contributing to the community.</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                                    <input
                                        required
                                        value={formData.title}
                                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                                        placeholder="e.g., Freelancer Invoicing"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                                    <select
                                        value={formData.category}
                                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                                    >
                                        <option>General</option>
                                        <option>HR</option>
                                        <option>Finance</option>
                                        <option>Sales</option>
                                        <option>Operations</option>
                                        <option>Crypto</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea
                                    required
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent h-24"
                                    placeholder="Describe how this workflow would work..."
                                />
                            </div>
                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    disabled={submitStatus === 'submitting'}
                                    className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
                                >
                                    {submitStatus === 'submitting' ? 'Submitting...' : 'Submit Suggestion'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            )}

            {/* Example Use Cases Section */}
            <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Popular Use Cases</h3>
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">Examples</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {exampleUseCases.map(useCase => (
                        <div key={useCase.id} className="bg-gradient-to-br from-white to-gray-50 p-5 rounded-xl border border-gray-200 hover:shadow-lg transition-all group">
                            <div className="flex justify-between items-start mb-2">
                                <span className="px-2 py-1 bg-blue-50 text-blue-600 text-xs rounded-full font-medium border border-blue-200">
                                    {useCase.category}
                                </span>
                                <div className="flex items-center gap-1 text-gray-500">
                                    <ThumbsUp size={14} className="fill-gray-300" />
                                    <span className="text-xs font-medium">{useCase.votes}</span>
                                </div>
                            </div>
                            <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                                {useCase.title}
                            </h3>
                            <p className="text-sm text-gray-600 line-clamp-2">
                                {useCase.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Community Submitted Use Cases */}
            {useCases.length > 0 && (
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Community Suggestions</h3>
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {useCases.map(useCase => (
                                <div key={useCase.id} className="bg-white p-5 rounded-xl border border-gray-200 hover:shadow-md transition-shadow group">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full font-medium">
                                            {useCase.category}
                                        </span>
                                        <button
                                            onClick={() => handleVote(useCase.id)}
                                            className="flex items-center gap-1 text-gray-400 hover:text-black transition-colors"
                                        >
                                            <ThumbsUp size={14} />
                                            <span className="text-xs font-medium">{useCase.votes}</span>
                                        </button>
                                    </div>
                                    <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                                        {useCase.title}
                                    </h3>
                                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                                        {useCase.description}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
