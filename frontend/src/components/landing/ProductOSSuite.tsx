import React, { useState } from 'react';
import {
    Database, Share2, Upload, FileCode, Search, Download,
    BarChart3, PieChart, TrendingUp, Brain, Users,
    ToggleLeft, FlaskConical, MessageSquare, MonitorPlay, AlertTriangle,
    LayoutDashboard, LineChart, Activity, FileJson,
    GitBranch, Clock, Zap,
    MessageCircle, Bell,
    Terminal, Webhook, HardDrive, Save, ArrowRight, ChevronDown, ChevronRight
} from 'lucide-react';

interface Tool {
    name: string;
    icon: any;
    description: string;
    link: string;
}

interface Category {
    id: string;
    name: string;
    count: number;
    tools: Tool[];
}

const categories: Category[] = [
    {
        id: 'infrastructure',
        name: 'Customer data infrastructure',
        count: 6,
        tools: [
            { name: 'Data Warehouse', icon: Database, description: 'Store and query all your business data in one place', link: '/docs/warehouse' },
            { name: 'Integrations', icon: Share2, description: 'Connect with 120+ external tools and services', link: '/docs/integrations' },
            { name: 'Data Ingestion', icon: Upload, description: 'Get data into Corridor from any source', link: '/docs/ingestion' },
            { name: 'Transformations', icon: FileCode, description: 'Clean and format data automatically', link: '/docs/transformations' },
            { name: 'Query Engine', icon: Search, description: 'SQL interface for deep data analysis', link: '/docs/query' },
            { name: 'Reverse ETL', icon: Download, description: 'Send Corridor data to other tools', link: '/docs/reverse-etl' }
        ]
    },
    {
        id: 'analytics',
        name: 'Analytics dashboards',
        count: 5,
        tools: [
            { name: 'Web Analytics', icon: BarChart3, description: 'Privacy-focused website traffic analysis', link: '/docs/web-analytics' },
            { name: 'Product Analytics', icon: PieChart, description: 'Understand how users interact with your app', link: '/docs/product-analytics' },
            { name: 'Revenue Analytics', icon: TrendingUp, description: 'Track MRR, churn, and financial health', link: '/docs/revenue' },
            { name: 'AI Analytics', icon: Brain, description: 'Natural language insights from your data', link: '/docs/ai-analytics' },
            { name: 'Group Analytics', icon: Users, description: 'Analyze B2B customer behavior', link: '/docs/group-analytics' }
        ]
    },
    {
        id: 'engineering',
        name: 'Product engineering',
        count: 5,
        tools: [
            { name: 'Feature Flags', icon: ToggleLeft, description: 'Safely roll out features to specific users', link: '/docs/feature-flags' },
            { name: 'A/B Testing', icon: FlaskConical, description: 'Experiment and optimize conversion rates', link: '/docs/ab-testing' },
            { name: 'Surveys', icon: MessageSquare, description: 'Collect user feedback directly in-app', link: '/docs/surveys' },
            { name: 'Session Replay', icon: MonitorPlay, description: 'Watch how users actually use your product', link: '/docs/session-replay' },
            { name: 'Error Tracking', icon: AlertTriangle, description: 'Monitor and fix application errors', link: '/docs/errors' }
        ]
    },
    {
        id: 'visualization',
        name: 'Data visualization',
        count: 4,
        tools: [
            { name: 'Dashboards', icon: LayoutDashboard, description: 'Create custom views for your metrics', link: '/docs/dashboards' },
            { name: 'Trends', icon: LineChart, description: 'Visualize data over time', link: '/docs/trends' },
            { name: 'Live View', icon: Activity, description: 'Real-time stream of user events', link: '/docs/live' },
            { name: 'Reports', icon: FileJson, description: 'Scheduled PDF and CSV reports', link: '/docs/reports' }
        ]
    },
    {
        id: 'automation',
        name: 'Automation',
        count: 3,
        tools: [
            { name: 'Workflows', icon: GitBranch, description: 'Visual builder for business logic', link: '/docs/workflows' },
            { name: 'Scheduled Tasks', icon: Clock, description: 'Run recurring jobs automatically', link: '/docs/cron' },
            { name: 'Triggers', icon: Zap, description: 'React to events in real-time', link: '/docs/triggers' }
        ]
    },
    {
        id: 'communication',
        name: 'Communication',
        count: 2,
        tools: [
            { name: 'Team Chat', icon: MessageCircle, description: 'Contextual discussion on data', link: '/docs/chat' },
            { name: 'Notifications', icon: Bell, description: 'Alerts via Email, Slack, or SMS', link: '/docs/notifications' }
        ]
    },
    {
        id: 'utilities',
        name: 'Utilities & add-ons',
        count: 4,
        tools: [
            { name: 'API Explorer', icon: Terminal, description: 'Test and debug API requests', link: '/docs/api' },
            { name: 'Webhooks', icon: Webhook, description: 'Manage outgoing webhooks', link: '/docs/webhooks' },
            { name: 'Backups', icon: HardDrive, description: 'Automated data snapshots', link: '/docs/backups' },
            { name: 'Exports', icon: Save, description: 'Bulk data export tools', link: '/docs/exports' }
        ]
    }
];

export const ProductOSSuite: React.FC = () => {
    const [expandedCategory, setExpandedCategory] = useState<string>('infrastructure');
    const [selectedTool, setSelectedTool] = useState<Tool>(categories[0].tools[0]);

    const handleCategoryClick = (categoryId: string) => {
        if (expandedCategory === categoryId) {
            setExpandedCategory('');
        } else {
            setExpandedCategory(categoryId);
            // Select first tool of new category
            const category = categories.find(c => c.id === categoryId);
            if (category && category.tools.length > 0) {
                setSelectedTool(category.tools[0]);
            }
        }
    };

    return (
        <div className="flex h-full bg-slate-50">
            {/* Left Sidebar - Categories & Tools */}
            <div className="w-2/3 border-r border-slate-200 overflow-y-auto bg-white">
                <div className="p-6">
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Product OS</h2>
                    <p className="text-slate-600 mb-8">
                        Our suite of tools are designed to help product engineers build and scale products.
                        There are seven main components to the Product OS toolkit.
                    </p>

                    <div className="space-y-4">
                        {categories.map((category) => (
                            <div key={category.id} className="border-b border-slate-100 last:border-0 pb-4 last:pb-0">
                                <button
                                    onClick={() => handleCategoryClick(category.id)}
                                    className="flex items-center gap-2 w-full text-left hover:text-blue-600 transition-colors py-2"
                                >
                                    {expandedCategory === category.id ? (
                                        <ChevronDown className="w-4 h-4 text-slate-400" />
                                    ) : (
                                        <ChevronRight className="w-4 h-4 text-slate-400" />
                                    )}
                                    <span className="font-semibold text-slate-900">{category.name}</span>
                                    <span className="text-slate-400 text-sm">({category.count})</span>
                                </button>

                                {expandedCategory === category.id && (
                                    <div className="grid grid-cols-3 gap-4 mt-4 pl-6 animate-in fade-in slide-in-from-top-2 duration-200">
                                        {category.tools.map((tool) => {
                                            const Icon = tool.icon;
                                            const isSelected = selectedTool.name === tool.name;
                                            return (
                                                <button
                                                    key={tool.name}
                                                    onClick={() => setSelectedTool(tool)}
                                                    className={`
                                                        flex flex-col items-center text-center p-3 rounded-lg transition-all
                                                        ${isSelected
                                                            ? 'bg-blue-50 border border-blue-200 shadow-sm'
                                                            : 'hover:bg-slate-50 border border-transparent hover:border-slate-200'
                                                        }
                                                    `}
                                                >
                                                    <div className={`p-2 rounded-md mb-2 ${isSelected ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-600'}`}>
                                                        <Icon className="w-5 h-5" />
                                                    </div>
                                                    <span className={`text-xs font-medium ${isSelected ? 'text-blue-700' : 'text-slate-700'}`}>
                                                        {tool.name}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right Panel - Tool Details */}
            <div className="w-1/3 bg-slate-50 p-8 flex flex-col items-center justify-center text-center border-l border-slate-200">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-6 w-full max-w-xs">
                    <div className="bg-blue-50 w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4">
                        {selectedTool.icon && <selectedTool.icon className="w-8 h-8 text-blue-600" />}
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">{selectedTool.name}</h3>
                    <p className="text-slate-600 text-sm mb-6 leading-relaxed">
                        {selectedTool.description}
                    </p>
                    <button className="w-full bg-amber-400 hover:bg-amber-500 text-slate-900 font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors">
                        Open {selectedTool.name}
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </div>

                <div className="text-xs text-slate-400 max-w-xs">
                    Part of the {categories.find(c => c.tools.some(t => t.name === selectedTool.name))?.name} suite
                </div>
            </div>
        </div>
    );
};
