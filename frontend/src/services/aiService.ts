import { Node, Edge, MarkerType } from 'reactflow';
import { withApiPath } from '../config/env';

interface WorkflowData {
    nodes: Node[];
    edges: Edge[];
}

interface WorkflowStep {
    id: string;
    name: string;
    type: string;
    order: number;
    config: any;
}

interface WorkflowTrigger {
    id: string;
    trigger_type: string;
    event_type?: string;
}

interface WorkflowResponse {
    id: string;
    name: string;
    description: string;
    steps: WorkflowStep[];
    triggers: WorkflowTrigger[];
}

interface GenerateResponse {
    workflow: WorkflowResponse;
    ai_explanation: string;
}

export const generateWorkflowFromPrompt = async (prompt: string): Promise<WorkflowData> => {
    const token = localStorage.getItem('auth_token');
    
    const response = await fetch(withApiPath('/workflows/generate'), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ prompt })
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to generate workflow');
    }
    
    const data: GenerateResponse = await response.json();
    
    return convertToReactFlow(data.workflow);
};

const convertToReactFlow = (workflow: WorkflowResponse): WorkflowData => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    let yOffset = 50;
    const xPos = 250;
    
    // 1. Add Trigger Nodes
    const triggerNodes: Node[] = [];
    
    if (workflow.triggers && workflow.triggers.length > 0) {
        workflow.triggers.forEach((trigger, index) => {
            const nodeId = `trigger-${trigger.id || index}`;
            triggerNodes.push({
                id: nodeId,
                type: 'trigger',
                position: { x: xPos, y: yOffset },
                data: { 
                    label: formatTriggerLabel(trigger), 
                    description: trigger.event_type || 'Manual Trigger' 
                }
            });
        });
    } else {
         triggerNodes.push({
            id: `trigger-manual`,
            type: 'trigger',
            position: { x: xPos, y: yOffset },
            data: { label: 'Manual Trigger', description: 'Started manually' }
        });
    }
    
    nodes.push(...triggerNodes);
    yOffset += 150;
    
    // 2. Add Step Nodes
    const stepNodes: Node[] = [];
    const sortedSteps = [...workflow.steps].sort((a, b) => a.order - b.order);
    
    sortedSteps.forEach((step) => {
        const nodeId = step.id;
        stepNodes.push({
            id: nodeId,
            type: mapStepTypeToNodeType(step.type),
            position: { x: xPos, y: yOffset },
            data: { 
                label: step.name, 
                description: step.type,
                config: step.config
            }
        });
        yOffset += 150;
    });
    
    nodes.push(...stepNodes);
    
    // 3. Generate Edges
    // Connect all triggers to the first step
    if (stepNodes.length > 0) {
        triggerNodes.forEach(trigger => {
            edges.push({
                id: `e-${trigger.id}-${stepNodes[0].id}`,
                source: trigger.id,
                target: stepNodes[0].id,
                markerEnd: { type: MarkerType.ArrowClosed }
            });
        });
        
        // Connect steps sequentially
        for (let i = 0; i < stepNodes.length - 1; i++) {
            edges.push({
                id: `e-${stepNodes[i].id}-${stepNodes[i+1].id}`,
                source: stepNodes[i].id,
                target: stepNodes[i+1].id,
                markerEnd: { type: MarkerType.ArrowClosed }
            });
        }
    }
    
    return { nodes, edges };
};

const formatTriggerLabel = (trigger: WorkflowTrigger): string => {
    switch(trigger.trigger_type) {
        case 'payment_event': return 'Payment Event';
        case 'webhook': return 'Webhook';
        case 'schedule': return 'Schedule';
        default: return 'Trigger';
    }
};

const mapStepTypeToNodeType = (stepType: string): string => {
    // Map backend step types to frontend node types (trigger, action, logic)
    switch(stepType) {
        case 'condition': return 'logic';
        case 'payment_trigger': return 'trigger';
        default: return 'action';
    }
};
