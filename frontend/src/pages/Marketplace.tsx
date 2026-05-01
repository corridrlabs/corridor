import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Layout } from '../components/Layout';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import {Badge} from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/Tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../components/ui/Dialog';
import api from '../services/api';
import { Plus, Check, Search, Zap, Globe, Lock } from 'lucide-react';

export default function Marketplace() {
    const [activeTab, setActiveTab] = useState('connectors');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedConnector, setSelectedConnector] = useState<any>(null);
    const [credentials, setCredentials] = useState<any>({});
    const queryClient = useQueryClient();

    // Fetch Connectors
    const { data: connectors = [] } = useQuery({
        queryKey: ['connectors'],
        queryFn: () => api.get('/marketplace/connectors').then(res => res.data)
    });

    // Fetch My Connections
    const { data: connections = [] } = useQuery({
        queryKey: ['connections'],
        queryFn: () => api.get('/marketplace/connections').then(res => res.data)
    });

    // Fetch Workflows
    const { data: workflows = [] } = useQuery({
        queryKey: ['workflows'],
        queryFn: () => api.get('/workflows/').then(res => res.data)
    });

    // Fetch Templates
    const { data: templates = [] } = useQuery({
        queryKey: ['workflow-templates'],
        queryFn: () => api.get('/workflows/templates').then(res => res.data)
    });

    // Create Connection Mutation
    const createConnection = useMutation({
        mutationFn: (data: any) => api.post('/marketplace/connections', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['connections'] });
            setSelectedConnector(null);
            setCredentials({});
        }
    });

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newConnector, setNewConnector] = useState({
        name: '',
        description: '',
        base_url: '',
        category: 'Custom',
        auth: { type: 'bearer' },
        visibility: 'private'
    });

    // Create Connector Mutation
    const createConnectorMutation = useMutation({
        mutationFn: (data: any) => api.post('/marketplace/connectors', data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['connectors'] });
            setIsCreateOpen(false);
            setNewConnector({ name: '', description: '', base_url: '', category: 'Custom', auth: { type: 'bearer' }, visibility: 'private' });
        }
    });

    const handleCreateConnector = () => {
        createConnectorMutation.mutate({
            ...newConnector,
            id: newConnector.name.toLowerCase().replace(/\s+/g, '_'),
            operations: {} // Empty operations for MVP
        });
    };

    const handleConnect = (connector: any) => {
        setSelectedConnector(connector);
        setCredentials({});
    };

    const handleSubmitConnection = () => {
        if (!selectedConnector) return;
        createConnection.mutate({
            connector_id: selectedConnector.id,
            credentials
        });
    };

    const handleInstallTemplate = (template: any) => {
        // Placeholder for installing template
        console.log("Installing template", template);
    };

    const filteredConnectors = connectors.filter((c: any) =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <Layout>
            <div className="p-8 max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">App Marketplace</h1>
                        <p className="text-gray-500 mt-2">Connect your favorite tools and automate your workflows.</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <Button onClick={() => setIsCreateOpen(true)} variant="outline">
                            <Plus className="w-4 h-4 mr-2" /> Build Connector
                        </Button>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                            <Input
                                placeholder="Search apps..."
                                className="pl-10 w-64"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="mb-8">
                        <TabsTrigger value="connectors">Connectors ({connectors.length})</TabsTrigger>
                        <TabsTrigger value="workflows">Workflows ({workflows.length})</TabsTrigger>
                        <TabsTrigger value="templates">Templates ({templates.length})</TabsTrigger>
                    </TabsList>

                    <TabsContent value="connectors">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredConnectors.map((connector: any) => {
                                const isConnected = connections.some((c: any) => c.connector_id === connector.id);
                                return (
                                    <Card key={connector.id} className="hover:shadow-lg transition-shadow">
                                        <CardHeader className="flex flex-row items-center gap-4">
                                            <div className="w-12 h-12 rounded-lg bg-gray-50 flex items-center justify-center text-2xl">
                                                {connector.icon ? <img src={connector.icon} alt={connector.name} className="w-full h-full object-contain" /> : connector.name.charAt(0)}
                                            </div>
                                            <div>
                                                <CardTitle className="text-lg">{connector.name}</CardTitle>
                                                <Badge variant="secondary" className="mt-1">{connector.category}</Badge>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-sm text-gray-500 line-clamp-2">{connector.description}</p>
                                        </CardContent>
                                        <CardFooter>
                                            {isConnected ? (
                                                <Button variant="outline" className="w-full text-green-600 border-green-200 bg-green-50">
                                                    <Check className="w-4 h-4 mr-2" /> Connected
                                                </Button>
                                            ) : (
                                                <Button className="w-full" onClick={() => handleConnect(connector)}>
                                                    Connect
                                                </Button>
                                            )}
                                        </CardFooter>
                                    </Card>
                                );
                            })}
                        </div>
                    </TabsContent>

                    <TabsContent value="templates">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {templates.map((template: any) => (
                                <Card key={template.id} className="border-l-4 border-l-blue-500">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Zap className="w-5 h-5 text-blue-500" />
                                            {template.name}
                                        </CardTitle>
                                        <CardDescription>{template.description}</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex items-center gap-2 text-sm text-gray-500">
                                            <div className="flex -space-x-2">
                                                {template.steps.map((step: any, i: number) => (
                                                    <div key={i} className="w-8 h-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-xs font-bold">
                                                        {i + 1}
                                                    </div>
                                                ))}
                                            </div>
                                            <span>{template.steps.length} Steps</span>
                                        </div>
                                    </CardContent>
                                    <CardFooter>
                                        <Button onClick={() => handleInstallTemplate(template)} variant="secondary" className="w-full">
                                            Install Workflow
                                        </Button>
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>
                    </TabsContent>

                    <TabsContent value="workflows">
                        {workflows.length === 0 ? (
                            <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                                <Zap className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900">No active workflows</h3>
                                <p className="text-gray-500 mb-4">Install a template or build one from scratch.</p>
                                <Button onClick={() => setActiveTab('templates')}>Browse Templates</Button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {workflows.map((workflow: any) => (
                                    <Card key={workflow.id} className="flex flex-row items-center justify-between p-6">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-3 h-3 rounded-full ${workflow.is_active ? 'bg-green-500' : 'bg-gray-300'}`} />
                                            <div>
                                                <h3 className="font-medium text-gray-900">{workflow.name}</h3>
                                                <p className="text-sm text-gray-500">{workflow.execution_count} runs • Last run: {workflow.last_run_date || 'Never'}</p>
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="sm">Edit</Button>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>

                {/* Connection Dialog */}
                <Dialog open={!!selectedConnector} onOpenChange={() => setSelectedConnector(null)}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Connect {selectedConnector?.name}</DialogTitle>
                            <DialogDescription>
                                {selectedConnector?.auth_type === 'bearer'
                                    ? 'Enter your API Token / Bearer Token below.'
                                    : 'Enter your API Key credentials.'}
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-4">
                            {selectedConnector?.auth_type === 'bearer' && (
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Access Token</label>
                                    <Input
                                        type="password"
                                        value={credentials.access_token || ''}
                                        onChange={(e) => setCredentials({ ...credentials, access_token: e.target.value })}
                                        placeholder="xoxb-..."
                                    />
                                </div>
                            )}

                            {selectedConnector?.auth_type === 'custom' && (
                                <>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Database</label>
                                        <Input
                                            value={credentials.database || ''}
                                            onChange={(e) => setCredentials({ ...credentials, database: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Username</label>
                                        <Input
                                            value={credentials.username || ''}
                                            onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">API Key</label>
                                        <Input
                                            type="password"
                                            value={credentials.api_key || ''}
                                            onChange={(e) => setCredentials({ ...credentials, api_key: e.target.value })}
                                        />
                                    </div>
                                </>
                            )}
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setSelectedConnector(null)}>Cancel</Button>
                            <Button onClick={handleSubmitConnection} disabled={createConnection.isPending}>
                                {createConnection.isPending ? 'Connecting...' : 'Save Connection'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Create Connector Dialog */}
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Build New Connector</DialogTitle>
                            <DialogDescription>Add a new API integration to the marketplace.</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Name</label>
                                <Input
                                    value={newConnector.name}
                                    onChange={(e) => setNewConnector({ ...newConnector, name: e.target.value })}
                                    placeholder="e.g. Slack, HubSpot"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Base URL</label>
                                <Input
                                    value={newConnector.base_url}
                                    onChange={(e) => setNewConnector({ ...newConnector, base_url: e.target.value })}
                                    placeholder="https://api.example.com/v1"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Description</label>
                                <Input
                                    value={newConnector.description}
                                    onChange={(e) => setNewConnector({ ...newConnector, description: e.target.value })}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                            <Button onClick={handleCreateConnector} disabled={createConnectorMutation.isPending}>
                                {createConnectorMutation.isPending ? 'Creating...' : 'Create Connector'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </Layout>
    );
}
