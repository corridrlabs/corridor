import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { GitBranch, MoreHorizontal } from 'lucide-react';

const LogicNode = ({ data, isConnectable }: NodeProps) => {
    return (
        <div className="w-64 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            {/* Input Handle */}
            <Handle
                type="target"
                position={Position.Top}
                isConnectable={isConnectable}
                className="w-3 h-3 bg-purple-500 border-2 border-white"
            />

            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-white">
                    <GitBranch className="w-4 h-4" />
                    <span className="font-medium text-sm">Condition</span>
                </div>
                <button className="text-white/80 hover:text-white">
                    <MoreHorizontal className="w-4 h-4" />
                </button>
            </div>

            {/* Content */}
            <div className="p-4">
                <div className="text-sm font-medium text-gray-900 mb-1">{data.label}</div>
                <div className="text-xs text-gray-500">{data.condition || 'If condition is met'}</div>
            </div>

            {/* Output Handles */}
            <div className="flex justify-between px-4 pb-2">
                <div className="relative">
                    <span className="text-[10px] text-green-600 font-bold absolute -top-4 left-0">TRUE</span>
                    <Handle
                        id="true"
                        type="source"
                        position={Position.Bottom}
                        isConnectable={isConnectable}
                        className="w-3 h-3 bg-green-500 border-2 border-white !left-2"
                    />
                </div>
                <div className="relative">
                    <span className="text-[10px] text-red-600 font-bold absolute -top-4 right-0">FALSE</span>
                    <Handle
                        id="false"
                        type="source"
                        position={Position.Bottom}
                        isConnectable={isConnectable}
                        className="w-3 h-3 bg-red-500 border-2 border-white !left-auto !right-2"
                    />
                </div>
            </div>
        </div>
    );
};

export default memo(LogicNode);
