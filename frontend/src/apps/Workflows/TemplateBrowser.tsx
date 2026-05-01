import React, { useState, useEffect } from 'react';
import { Search, Filter, ArrowRight, Zap, ShoppingCart, RefreshCw, UserPlus, FileText, Mail, DollarSign, Shield, Heart } from 'lucide-react';
import { withApiPath } from '../../config/env';

interface Template {
    id: string;
    name: string;
    description: string;
    category: string;
    steps: any[];
    triggers: any[];
}

interface Props {
    onSelect: (template: Template) => void;
    onCancel: () => void;
}

export default function TemplateBrowser({ onSelect, onCancel }: Props) {
    const [templates, setTemplates] = useState<Template[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(withApiPath('/workflows/templates'), {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                setTemplates(data);
            }
        } catch (error) {
            console.error('Failed to fetch templates', error);
        } finally {
            setLoading(false);
        }
    };

    const categories = [
        { id: 'all', label: 'All Templates' },
        { id: 'sales', label: 'Sales & Orders' },
        { id: 'marketing', label: 'Marketing' },
        { id: 'finance', label: 'Finance' },
        { id: 'support', label: 'Support' },
        { id: 'hr', label: 'HR & Admin' }
    ];

    const getIconForTemplate = (name: string) => {
        const lowerName = name.toLowerCase();
        if (lowerName.includes('order') || lowerName.includes('cart')) return <ShoppingCart className="w-6 h-6 text-blue-600" />;
        if (lowerName.includes('subscription') || lowerName.includes('renewal')) return <RefreshCw className="w-6 h-6 text-green-600" />;
        if (lowerName.includes('onboarding')) return <UserPlus className="w-6 h-6 text-purple-600" />;
        if (lowerName.includes('invoice')) return <FileText className="w-6 h-6 text-orange-600" />;
        if (lowerName.includes('email')) return <Mail className="w-6 h-6 text-indigo-600" />;
        if (lowerName.includes('refund') || lowerName.includes('payment')) return <DollarSign className="w-6 h-6 text-red-600" />;
        if (lowerName.includes('escrow') || lowerName.includes('dispute')) return <Shield className="w-6 h-6 text-slate-600" />;
        if (lowerName.includes('loyalty') || lowerName.includes('feedback')) return <Heart className="w-6 h-6 text-pink-600" />;
        return <Zap className="w-6 h-6 text-gray-600" />;
    };

    const filteredTemplates = templates.filter(template => {
        const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
        const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            template.description.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl h-[80vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-gray-200 flex items-center justify-between bg-gray-50">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Workflow Templates</h2>
                        <p className="text-gray-500 mt-1">Start with a pre-built workflow designed for your business needs</p>
                    </div>
                    <button
                        onClick={onCancel}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <span className="sr-only">Close</span>
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    {/* Sidebar Filters */}
                    <div className="w-64 border-r border-gray-200 p-4 bg-gray-50 overflow-y-auto">
                        <div className="space-y-1">
                            {categories.map(category => (
                                <button
                                    key={category.id}
                                    onClick={() => setSelectedCategory(category.id)}
                                    className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${selectedCategory === category.id
                                            ? 'bg-black text-white shadow-sm'
                                            : 'text-gray-600 hover:bg-gray-200'
                                        }`}
                                >
                                    {category.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 flex flex-col bg-white">
                        {/* Search Bar */}
                        <div className="p-4 border-b border-gray-100">
                            <div className="relative max-w-md">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search templates..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all"
                                />
                            </div>
                        </div>

                        {/* Templates Grid */}
                        <div className="flex-1 overflow-y-auto p-6">
                            {loading ? (
                                <div className="flex items-center justify-center h-64">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
                                </div>
                            ) : filteredTemplates.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {filteredTemplates.map(template => (
                                        <div
                                            key={template.id}
                                            className="group relative bg-white border border-gray-200 rounded-xl p-5 hover:shadow-lg hover:border-gray-300 transition-all cursor-pointer flex flex-col h-full"
                                            onClick={() => onSelect(template)}
                                        >
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="p-2 bg-gray-50 rounded-lg group-hover:bg-gray-100 transition-colors">
                                                    {getIconForTemplate(template.name)}
                                                </div>
                                                <span className="px-2.5 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                                                    {template.steps.length} steps
                                                </span>
                                            </div>

                                            <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-black transition-colors">
                                                {template.name}
                                            </h3>

                                            <p className="text-sm text-gray-500 mb-4 line-clamp-3 flex-1">
                                                {template.description}
                                            </p>

                                            <div className="mt-auto pt-4 border-t border-gray-50 flex items-center text-sm font-medium text-black opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0">
                                                Use Template <ArrowRight className="w-4 h-4 ml-1" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-64 text-center">
                                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                        <Search className="w-8 h-8 text-gray-400" />
                                    </div>
                                    <h3 className="text-lg font-medium text-gray-900">No templates found</h3>
                                    <p className="text-gray-500 mt-1">Try adjusting your search or category filter</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
