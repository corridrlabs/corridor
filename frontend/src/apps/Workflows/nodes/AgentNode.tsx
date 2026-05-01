import React from 'react';
import { Handle, Position } from 'reactflow';
import { Bot, Settings } from 'lucide-react';

const AgentNode = ({ data }: any) => {
    return (
        <div className="px-4 py-3 shadow-lg rounded-lg bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 min-w-[200px]">
            <Handle type="target" position={Position.Top} className="w-3 h-3 !bg-green-500" />

            <div className="flex items-center gap-2 mb-2">
                <div className="flex items-center justify-center w-8 h-8 bg-green-500 rounded-full">
                    <Bot className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                    <div className="text-xs font-semibold text-green-700 uppercase tracking-wide">Agent Action</div>
                    <div className="text-sm font-medium text-gray-900">{data.label || 'AI Agent Task'}</div>
                </div>
                <Settings className="w-4 h-4 text-green-600 cursor-pointer hover:text-green-700" />
            </div>

            {data.description && (
                <div className="text-xs text-gray-600 mt-1 border-t border-green-200 pt-2">
                    {data.description}
                </div>
            )}

            {data.agent_type && (
                <div className="mt-2 flex items-center gap-1">
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                        {data.agent_type}
                    </span>
                </div>
            )}

            <Handle type="source" position={Position.Bottom} className="w-3 h-3 !bg-green-500" />
        </div>
    );
};

export default AgentNode;
