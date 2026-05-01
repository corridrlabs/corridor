import React, { useState, useCallback, useRef } from 'react';
import ReactFlow, {
    ReactFlowProvider,
    addEdge,
    useNodesState,
    useEdgesState,
    Controls,
    Background,
    Connection,
    Edge,
    Node,
    Panel,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Sparkles, Save, Play, Plus, X, Activity, Upload, Code, BookOpen, Box } from 'lucide-react';

import TriggerNode from './nodes/TriggerNode';
import ActionNode from './nodes/ActionNode';
import LogicNode from './nodes/LogicNode';
import AgentNode from './nodes/AgentNode';
import TemplateBrowser from './TemplateBrowser';
import StepConfigModal from './components/StepConfigModal';
import ExecutionList from './components/ExecutionList';
import DataImport from './components/DataImport';
import { generateWorkflowFromPrompt } from '../../services/aiService';
import { withApiPath } from '../../config/env';

const nodeTypes = {
    trigger: TriggerNode,
    action: ActionNode,
    logic: LogicNode,
    agent: AgentNode,
};

const initialNodes: Node[] = [
    {
        id: '1',
        type: 'trigger',
        position: { x: 250, y: 50 },
        data: { label: 'Payment Received', description: 'When a payment is successful' },
    },
];

const WorkflowBuilder = () => {
    const reactFlowWrapper = useRef<HTMLDivElement>(null);
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
    const [aiPrompt, setAiPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    const [showAiPanel, setShowAiPanel] = useState(true);
    const [showTemplateBrowser, setShowTemplateBrowser] = useState(false);
    const [showExecutions, setShowExecutions] = useState(false);
    const [showDataImport, setShowDataImport] = useState(false);
    const [selectedNode, setSelectedNode] = useState<Node | null>(null);

    const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
        setSelectedNode(node);
    }, []);

    const handleConfigSave = (nodeId: string, newData: any) => {
        setNodes((nds) =>
            nds.map((node) => {
                if (node.id === nodeId) {
                    return { ...node, data: newData };
                }
                return node;
            })
        );
        setSelectedNode(null);
    };

    const instantiateTemplate = async (templateId: string) => {
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(withApiPath(`/workflows/templates/${templateId}/instantiate`), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const workflow = await response.json();

                // Convert backend workflow to ReactFlow format
                // This is similar to what we do in aiService, we should probably share this logic
                // For now, we'll use a simplified conversion or reuse the one from aiService if exported
                // Or just reload the page/fetch the workflow

                // Let's assume we want to load it into the builder
                // We need to convert steps/triggers to nodes/edges
                // Reusing the conversion logic from aiService would be best, but it's not exported
                // Let's just alert for now and maybe redirect

                alert('Template instantiated successfully! Redirecting to workflow...');
                // navigate(`/workflows/${workflow.id}`); // If we had routing set up

                // For this builder demo, let's try to load it into the state
                // We'll need to fetch the full workflow details if the response is partial
                // But instantiate returns full workflow

                // Quick conversion for demo purposes (similar to aiService)
                const newNodes: Node[] = [];
                const newEdges: any[] = [];
                let yOffset = 50;

                // Triggers
                workflow.triggers.forEach((t: any, i: number) => {
                    newNodes.push({
                        id: `trigger-${i}`,
                        type: 'trigger',
                        position: { x: 250, y: yOffset },
                        data: { label: t.trigger_type, description: t.event_type }
                    });
                    yOffset += 150;
                });

                // Steps
                workflow.steps.sort((a: any, b: any) => a.order - b.order).forEach((s: any) => {
                    newNodes.push({
                        id: s.id,
                        type: s.type === 'condition' ? 'logic' : (s.type === 'payment_trigger' ? 'trigger' : 'action'),
                        position: { x: 250, y: yOffset },
                        data: { label: s.name, description: s.type, config: s.config }
                    });
                    yOffset += 150;
                });

                // Edges
                for (let i = 0; i < newNodes.length - 1; i++) {
                    newEdges.push({
                        id: `e-${newNodes[i].id}-${newNodes[i + 1].id}`,
                        source: newNodes[i].id,
                        target: newNodes[i + 1].id
                    });
                }

                setNodes(newNodes);
                setEdges(newEdges);
                setWorkflowId(workflow.id);
                setShowTemplateBrowser(false);
            }
        } catch (error) {
            console.error("Failed to instantiate template", error);
            alert("Failed to create workflow from template");
        }
    };

    const onConnect = useCallback(
        (params: Connection) => setEdges((eds) => addEdge(params, eds)),
        [setEdges]
    );

    const onDragOver = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    const onDrop = useCallback(
        (event: React.DragEvent) => {
            event.preventDefault();

            const type = event.dataTransfer.getData('application/reactflow');

            // check if the dropped element is valid
            if (typeof type === 'undefined' || !type) {
                return;
            }

            const position = reactFlowInstance.project({
                x: event.clientX - (reactFlowWrapper.current?.getBoundingClientRect().left || 0),
                y: event.clientY - (reactFlowWrapper.current?.getBoundingClientRect().top || 0),
            });

            const newNode: Node = {
                id: `${type}-${Date.now()}`,
                type,
                position,
                data: { label: `${type} node` },
            };

            setNodes((nds) => nds.concat(newNode));
        },
        [reactFlowInstance, setNodes]
    );

    const handleAiGenerate = async () => {
        if (!aiPrompt.trim()) return;

        setIsGenerating(true);
        try {
            const result = await generateWorkflowFromPrompt(aiPrompt);
            if (result) {
                setNodes(result.nodes);
                setEdges(result.edges);
            }
        } catch (error) {
            console.error("Failed to generate workflow", error);
        } finally {
            setIsGenerating(false);
        }
    };

    const [workflowId, setWorkflowId] = useState<string | null>(null);

    const saveWorkflow = async () => {
        const flow = reactFlowInstance.toObject();

        // 1. Convert Nodes to Linear/DAG Steps for Backend
        // The backend expects specific schema: ID, Type, Action, Config, Next

        // Find Start Node (Trigger)
        const triggerNode = nodes.find(n => n.type === 'trigger');
        if (!triggerNode) {
            alert("Workflow must have a trigger");
            return;
        }

        const steps: any[] = [];
        const visited = new Set<string>();

        // Helper to traverse graph (BFS/DFS) to build ordered list or DAG
        // Backend currently naively takes a list and expects "Next" pointers

        const processNode = (nodeId: string) => {
            if (visited.has(nodeId)) return;
            visited.add(nodeId);

            const node = nodes.find(n => n.id === nodeId);
            if (!node) return;

            // Find outgoing edge
            const outEdges = edges.filter(e => e.source === nodeId);
            // Default next is the first outgoing edge target
            let nextId = outEdges.length > 0 ? outEdges[0].target : "";

            // Map Node Type to Backend Type
            let backendType = "ACTION";
            let backendAction = "EMAIL_SEND"; // Default
            let config = { ...node.data }; // Copy config

            if (node.type === 'trigger') {
                // Trigger is handled separately in metadata usually, but we can treat it as start
                // For this simple engine, we might skip trigger node in 'steps' array if backend handles trigger separately
                // OR we treat it as a NO-OP step.
                backendType = "WAIT"; // Just a placeholder
            } else if (node.type === 'logic') {
                backendType = "CONDITION";
                // Logic nodes might have 2 edges (True/False)
                // We need to know which handle is which.
                // Assuming ReactFlow edges have 'sourceHandle' property if we used handles.
                // For now, let's assume simple linear or single condition
                config["key"] = "amount"; // Mock default
                config["value"] = 1000;
                // We need to find the 'False' path if exists
                const falseEdge = outEdges.find(e => e.sourceHandle === 'false'); // If we had handles
                if (falseEdge) {
                    config["false_next"] = falseEdge.target;
                }
            } else if (node.type === 'action') {
                backendType = "ACTION";
                backendAction = "PAYMENT_PAYOUT"; // Defaulting all actions to payment for demo
                config["amount"] = 50;
                config["currency"] = "USDC";
            }

            // Don't add trigger to 'steps' if it's just a listener
            if (node.type !== 'trigger') {
                steps.push({
                    id: node.id,
                    type: backendType,
                    action: backendAction,
                    config: config,
                    next: nextId
                });
            }

            // Recurse
            outEdges.forEach(e => processNode(e.target));
        };

        // Start traversal from trigger's next node
        const initialEdges = edges.filter(e => e.source === triggerNode.id);
        initialEdges.forEach(e => processNode(e.target));

        const payload = {
            name: "New Workflow " + new Date().toLocaleTimeString(),
            description: "Created via Visual Builder",
            status: "active",
            definition: steps // Backend will store this as JSON
        };

        try {
            // Note: Currently backend `createWorkflow` expects `name`, `template` (json strings)
            // We might need to adjust the backend handler or match here.
            // Let's assume we are posting to an endpoint that accepts this.
            // For the demo, we are likely creating a 'Template' actually.

            const response = await fetch(withApiPath('/workflows/templates'), { // Assuming we save as template
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // 'Authorization': ... 
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                const data = await response.json();
                setWorkflowId(data.id);
                alert('Workflow saved successfully!');
            } else {
                const err = await response.text();
                console.error(err);
                alert('Failed to save workflow: ' + err);
            }
        } catch (error) {
            console.error("Save failed", error);
            alert('Error saving workflow');
        }
    };

    return (
        <div className="h-full flex flex-col bg-gray-50">
            {/* Toolbar */}
            <div className="h-16 bg-white border-b border-gray-200 px-6 flex items-center justify-between z-10">
                <div className="flex items-center gap-4">
                    <h2 className="text-lg font-semibold text-gray-900">New Workflow</h2>
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">Draft</span>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowTemplateBrowser(true)}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                        <Sparkles className="w-4 h-4 text-purple-600" />
                        Browse Templates
                    </button>
                    <button onClick={saveWorkflow} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                        <Save className="w-4 h-4" />
                        Save Draft
                    </button>
                    <button
                        onClick={() => setShowDataImport(true)}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                        <Upload className="w-4 h-4" />
                        Import
                    </button>
                    <button
                        onClick={() => setShowExecutions(!showExecutions)}
                        className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border rounded-lg hover:bg-gray-50 ${showExecutions ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'text-gray-700 bg-white border-gray-300'}`}
                    >
                        <Activity className="w-4 h-4" />
                        Executions
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-sm">
                        <Play className="w-4 h-4" />
                        Activate
                    </button>
                </div>
            </div>

            {showTemplateBrowser && (
                <TemplateBrowser
                    onSelect={(template) => instantiateTemplate(template.id)}
                    onCancel={() => setShowTemplateBrowser(false)}
                />
            )}

            {showDataImport && workflowId && (
                <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setShowDataImport(false)}></div>
                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                            <div className="absolute top-0 right-0 pt-4 pr-4">
                                <button
                                    type="button"
                                    className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
                                    onClick={() => setShowDataImport(false)}
                                >
                                    <span className="sr-only">Close</span>
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                            <div className="p-6">
                                <DataImport workflowId={workflowId} onImportComplete={() => setShowExecutions(true)} />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {selectedNode && (
                <StepConfigModal
                    node={selectedNode}
                    onSave={handleConfigSave}
                    onCancel={() => setSelectedNode(null)}
                />
            )}

            <div className="flex-1 flex overflow-hidden">
                {/* Sidebar */}
                <div className="w-64 bg-white border-r border-gray-200 p-4 flex flex-col gap-4 z-10">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Components</div>

                    <div
                        className="p-3 bg-amber-50 border border-amber-200 rounded-lg cursor-grab hover:shadow-md transition-all"
                        onDragStart={(event) => event.dataTransfer.setData('application/reactflow', 'trigger')}
                        draggable
                    >
                        <div className="flex items-center gap-2 text-amber-700 font-medium mb-1">
                            <Sparkles className="w-4 h-4" /> Trigger
                        </div>
                        <div className="text-xs text-amber-600">Starts the workflow</div>
                    </div>

                    <div
                        className="p-3 bg-blue-50 border border-blue-200 rounded-lg cursor-grab hover:shadow-md transition-all"
                        onDragStart={(event) => event.dataTransfer.setData('application/reactflow', 'action')}
                        draggable
                    >
                        <div className="flex items-center gap-2 text-blue-700 font-medium mb-1">
                            <Plus className="w-4 h-4" /> Action
                        </div>
                        <div className="text-xs text-blue-600">Performs a task</div>
                    </div>

                    <div
                        className="p-3 bg-purple-50 border border-purple-200 rounded-lg cursor-grab hover:shadow-md transition-all"
                        onDragStart={(event) => event.dataTransfer.setData('application/reactflow', 'logic')}
                        draggable
                    >
                        <div className="flex items-center gap-2 text-purple-700 font-medium mb-1">
                            <div className="rotate-90"><div className="rotate-180"><Plus className="w-4 h-4" /></div></div> Logic
                        </div>
                        <div className="text-xs text-purple-600">Branching & conditions</div>
                    </div>

                    <div
                        className="p-3 bg-green-50 border border-green-200 rounded-lg cursor-grab hover:shadow-md transition-all"
                        onDragStart={(event) => event.dataTransfer.setData('application/reactflow', 'agent')}
                        draggable
                    >
                        <div className="flex items-center gap-2 text-green-700 font-medium mb-1">
                            <Sparkles className="w-4 h-4" /> AI Agent
                        </div>
                        <div className="text-xs text-green-600">Intelligent automation</div>
                    </div>
                </div>

                {/* Main Content Area (Canvas + Bottom Panel) */}
                <div className="flex-1 flex flex-col h-full overflow-hidden">
                    {/* Canvas */}
                    <div className="flex-1 relative" ref={reactFlowWrapper}>
                        <ReactFlow
                            nodes={nodes}
                            edges={edges}
                            onNodesChange={onNodesChange}
                            onEdgesChange={onEdgesChange}
                            onConnect={onConnect}
                            onNodeClick={onNodeClick}
                            onInit={setReactFlowInstance}
                            onDrop={onDrop}
                            onDragOver={onDragOver}
                            nodeTypes={nodeTypes}
                            fitView
                        >
                            <Background color="#f1f5f9" gap={16} />
                            <Controls />

                            {/* AI Panel */}
                            {showAiPanel && (
                                <Panel position="top-center" className="bg-white p-1 rounded-xl shadow-xl border border-gray-200 w-[500px] m-4">
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                                            <Sparkles className={`w-5 h-5 ${isGenerating ? 'text-indigo-500 animate-pulse' : 'text-gray-400'}`} />
                                        </div>
                                        <input
                                            type="text"
                                            className="w-full pl-10 pr-12 py-3 bg-transparent border-none focus:ring-0 text-sm text-gray-900 placeholder-gray-500"
                                            placeholder="Describe a workflow to build with AI..."
                                            value={aiPrompt}
                                            onChange={(e) => setAiPrompt(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleAiGenerate()}
                                            disabled={isGenerating}
                                        />
                                        <div className="absolute inset-y-0 right-2 flex items-center">
                                            <button
                                                onClick={() => setShowAiPanel(false)}
                                                className="p-1 hover:bg-gray-100 rounded-full text-gray-400"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                    {isGenerating && (
                                        <div className="px-4 py-2 bg-indigo-50 text-indigo-700 text-xs rounded-b-lg border-t border-indigo-100 flex items-center gap-2">
                                            <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" />
                                            Generating workflow structure...
                                        </div>
                                    )}
                                </Panel>
                            )}
                        </ReactFlow>
                    </div>

                    {/* Execution List Panel */}
                    {showExecutions && workflowId && (
                        <div className="h-64 border-t border-gray-200 bg-white z-20">
                            <ExecutionList workflowId={workflowId} />
                        </div>
                    )}
                </div>
            </div>
            {/* Documentation Links */}
            <div className="p-6 bg-white border-t border-gray-200">
                <div className="flex gap-4">
                    <a href="/developers" target="_blank" className="btn-secondary flex items-center gap-2">
                        <Code className="w-4 h-4" />
                        For Developers
                    </a>
                    <a href="/developers" target="_blank" className="btn-secondary flex items-center gap-2">
                        <BookOpen className="w-4 h-4" />
                        For Businesses
                    </a>
                    <a href="/developers" target="_blank" className="btn-secondary flex items-center gap-2">
                        <Box className="w-4 h-4" />
                        For Partners
                    </a>
                </div>
            </div>
        </div>
    );
};

export default () => (
    <ReactFlowProvider>
        <WorkflowBuilder />
    </ReactFlowProvider>
);
