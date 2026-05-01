import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Activity, MoreHorizontal } from 'lucide-react';

const ActionNode = ({ data, isConnectable }: NodeProps) => {
    return (
        <div className="w-64 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            {/* Input Handle */}
            <Handle
                type="target"
                position={Position.Top}
                isConnectable={isConnectable}
                className="w-3 h-3 bg-blue-500 border-2 border-white"
            />

            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-white">
                    <Activity className="w-4 h-4" />
                    <span className="font-medium text-sm">Action</span>
                </div>
                <button className="text-white/80 hover:text-white">
                    <MoreHorizontal className="w-4 h-4" />
                </button>
            </div>

            {/* Content */}
            <div className="p-4">
                <div className="text-sm font-medium text-gray-900 mb-1">{data.label}</div>
                <div className="text-xs text-gray-500">{data.description || 'Performs an action'}</div>

                {data.config && (
                    <div className="mt-2 pt-2 border-t border-gray-100 text-xs text-gray-400">
                        {Object.keys(data.config).length} parameters configured
                    </div>
                )}
            </div>

            {/* Output Handle */}
            <Handle
                type="source"
                position={Position.Bottom}
                isConnectable={isConnectable}
                className="w-3 h-3 bg-blue-500 border-2 border-white"
            />
        </div>
    );
};

export default memo(ActionNode);
