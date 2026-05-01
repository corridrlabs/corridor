import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Zap, MoreHorizontal } from 'lucide-react';

const TriggerNode = ({ data, isConnectable }: NodeProps) => {
    return (
        <div className="w-64 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-amber-500 to-orange-600 p-3 flex items-center justify-between">
                <div className="flex items-center gap-2 text-white">
                    <Zap className="w-4 h-4" />
                    <span className="font-medium text-sm">Trigger</span>
                </div>
                <button className="text-white/80 hover:text-white">
                    <MoreHorizontal className="w-4 h-4" />
                </button>
            </div>

            {/* Content */}
            <div className="p-4">
                <div className="text-sm font-medium text-gray-900 mb-1">{data.label}</div>
                <div className="text-xs text-gray-500">{data.description || 'Starts the workflow'}</div>
            </div>

            {/* Output Handle */}
            <Handle
                type="source"
                position={Position.Bottom}
                isConnectable={isConnectable}
                className="w-3 h-3 bg-orange-500 border-2 border-white"
            />
        </div>
    );
};

export default memo(TriggerNode);
