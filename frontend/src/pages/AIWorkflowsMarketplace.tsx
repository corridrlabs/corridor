import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/Tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../components/ui/Dialog';
import api from '../services/api';
import {
    Search, Zap, Bot, MessageSquare, DollarSign, Users, TrendingUp,
    Settings, Rocket, Brain, Check, Play, Star, Filter
} from 'lucide-react';

interface Workflow {
    id: string;
    name: string;
    category: string;
    description: string;
    price: { type: string; amount: number; currency?: string; description?: string };
    features: string[];
    whatsapp_enabled?: boolean;
    ai_model?: string;
}

interface Category {
    id: string;
    name: string;
    icon: string;
}

const categoryIcons: Record<string, React.ReactNode> = {
    'financial_ops': <DollarSign className="w-5 h-5" />,
    'payroll': <DollarSign className="w-5 h-5" />,
    'ewa': <Zap className="w-5 h-5" />,
    'sales_crm': <TrendingUp className="w-5 h-5" />,
    'human_capital': <Users className="w-5 h-5" />,
    'operations': <Settings className="w-5 h-5" />,
    'marketing': <Rocket className="w-5 h-5" />,
    'advanced_ai': <Brain className="w-5 h-5" />
};

export default function AIWorkflowsMarketplace() {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
    const [whatsappOnly, setWhatsappOnly] = useState(false);
    const queryClient = useQueryClient();

    // Fetch all workflows
    const { data: workflowsData, isLoading } = useQuery({
        queryKey: ['ai-workflows', searchQuery, selectedCategory, whatsappOnly],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (searchQuery) params.append('search', searchQuery);
            if (selectedCategory) params.append('category', selectedCategory);
            if (whatsappOnly) params.append('whatsapp_only', 'true');
            const res = await api.get(`/ai-workflows?${params.toString()}`);
            return res.data;
        }
    });

    // Fetch summary
    const { data: summary } = useQuery({
        queryKey: ['ai-workflows-summary'],
        queryFn: () => api.get('/ai-workflows/summary').then(res => res.data)
    });

    // Fetch categories
    const { data: categoriesData } = useQuery({
        queryKey: ['ai-workflows-categories'],
        queryFn: () => api.get('/ai-workflows/categories').then(res => res.data)
    });

    // Execute workflow mutation
    const executeWorkflow = useMutation({
        mutationFn: (workflowId: string) => api.post('/ai-workflows/execute', {
            workflow_id: workflowId,
            organization_id: 'demo-org',
            trigger_data: {}
        }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ai-workflows'] });
            setSelectedWorkflow(null);
        }
    });

    const workflows: Workflow[] = workflowsData?.workflows || [];
    const categories: Category[] = categoriesData?.categories || [];

    const formatPrice = (price: Workflow['price']) => {
        if (price.type === 'monthly') return `$${price.amount}/mo`;
        if (price.type === 'per_employee') return `$${price.amount}/employee`;
        if (price.type === 'per_request') return `$${price.amount}/request`;
        if (price.type === 'percentage') return `${price.amount}% ${price.description || ''}`;
        if (price.type === 'one_time') return `$${price.amount}`;
        return `$${price.amount}`;
    };

    return (
        <div className="p-8 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-start mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        <Bot className="w-8 h-8 text-indigo-600" />
                        AI Workflows Marketplace
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">
                        100+ AI-powered automation workflows for payroll, finance, HR, and sales
                    </p>
                </div>
                <div className="text-right">
                    <div className="text-3xl font-bold text-indigo-600">{summary?.total_workflows || 100}</div>
                    <div className="text-sm text-gray-500">Workflows Available</div>
                </div>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-4 gap-4 mb-8">
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-4 text-white">
                    <div className="text-2xl font-bold">{summary?.total_workflows || 100}</div>
                    <div className="text-sm opacity-90">Total Workflows</div>
                </div>
                <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-4 text-white">
                    <div className="text-2xl font-bold">{summary?.whatsapp_enabled || 39}</div>
                    <div className="text-sm opacity-90 flex items-center gap-1">
                        <MessageSquare className="w-4 h-4" /> WhatsApp Enabled
                    </div>
                </div>
                <div className="bg-gradient-to-r from-orange-500 to-red-600 rounded-xl p-4 text-white">
                    <div className="text-2xl font-bold">8</div>
                    <div className="text-sm opacity-90">Categories</div>
                </div>
                <div className="bg-gradient-to-r from-blue-500 to-cyan-600 rounded-xl p-4 text-white">
                    <div className="text-2xl font-bold">$49</div>
                    <div className="text-sm opacity-90">Starting Price</div>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="flex items-center gap-4 mb-6">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <Input
                        placeholder="Search workflows..."
                        className="pl-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <Button
                    variant={whatsappOnly ? 'primary' : 'outline'}
                    onClick={() => setWhatsappOnly(!whatsappOnly)}
                    className="flex items-center gap-2"
                >
                    <MessageSquare className="w-4 h-4" />
                    WhatsApp Only
                </Button>
            </div>

            {/* Category Tabs */}
            <Tabs value={selectedCategory || 'all'} onValueChange={(val) => setSelectedCategory(val === 'all' ? null : val)}>
                <TabsList className="mb-6 flex-wrap">
                    <TabsTrigger value="all">All Workflows</TabsTrigger>
                    {categories.map((cat) => (
                        <TabsTrigger key={cat.id} value={cat.id}>
                            <span className="flex items-center gap-2">{categoryIcons[cat.id]} {cat.name}</span>
                        </TabsTrigger>
                    ))}
                </TabsList>

                <TabsContent value={selectedCategory || 'all'}>
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {workflows.map((workflow) => (
                                <Card key={workflow.id} className="hover:shadow-lg transition-all hover:scale-[1.02] border-2 hover:border-indigo-200 dark:hover:border-indigo-800">
                                    <CardHeader>
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white">
                                                    {categoryIcons[workflow.category] || <Zap className="w-5 h-5" />}
                                                </div>
                                                <div>
                                                    <CardTitle className="text-lg">{workflow.name}</CardTitle>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <Badge variant="secondary" className="text-xs">
                                                            {workflow.category.replace('_', ' ')}
                                                        </Badge>
                                                        {workflow.whatsapp_enabled && (
                                                            <Badge className="bg-green-100 text-green-700 text-xs">
                                                                <MessageSquare className="w-3 h-3 mr-1" /> WhatsApp
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-4">
                                            {workflow.description}
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {workflow.features?.slice(0, 3).map((feature, i) => (
                                                <span key={i} className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                                                    {feature}
                                                </span>
                                            ))}
                                        </div>
                                    </CardContent>
                                    <CardFooter className="flex items-center justify-between">
                                        <div className="text-lg font-bold text-indigo-600">
                                            {formatPrice(workflow.price)}
                                        </div>
                                        <Button onClick={() => setSelectedWorkflow(workflow)}>
                                            <Play className="w-4 h-4 mr-2" /> Activate
                                        </Button>
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>

            {/* Workflow Detail Dialog */}
            <Dialog open={!!selectedWorkflow} onOpenChange={() => setSelectedWorkflow(null)}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white">
                                {selectedWorkflow && categoryIcons[selectedWorkflow.category]}
                            </div>
                            {selectedWorkflow?.name}
                        </DialogTitle>
                        <DialogDescription>{selectedWorkflow?.description}</DialogDescription>
                    </DialogHeader>

                    <div className="py-4 space-y-4">
                        <div>
                            <h4 className="font-medium mb-2">Features</h4>
                            <ul className="space-y-2">
                                {selectedWorkflow?.features?.map((feature, i) => (
                                    <li key={i} className="flex items-center gap-2 text-sm">
                                        <Check className="w-4 h-4 text-green-500" />
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="flex items-center gap-4">
                            {selectedWorkflow?.whatsapp_enabled && (
                                <Badge className="bg-green-100 text-green-700">
                                    <MessageSquare className="w-4 h-4 mr-1" /> WhatsApp Enabled
                                </Badge>
                            )}
                            {selectedWorkflow?.ai_model && (
                                <Badge className="bg-purple-100 text-purple-700">
                                    <Brain className="w-4 h-4 mr-1" /> {selectedWorkflow.ai_model}
                                </Badge>
                            )}
                        </div>

                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                            <div className="text-2xl font-bold text-indigo-600">
                                {selectedWorkflow && formatPrice(selectedWorkflow.price)}
                            </div>
                            <div className="text-sm text-gray-500">
                                {selectedWorkflow?.price.description || 'Per month'}
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSelectedWorkflow(null)}>Cancel</Button>
                        <Button
                            onClick={() => selectedWorkflow && executeWorkflow.mutate(selectedWorkflow.id)}
                            disabled={executeWorkflow.isPending}
                        >
                            {executeWorkflow.isPending ? 'Activating...' : 'Activate Workflow'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
