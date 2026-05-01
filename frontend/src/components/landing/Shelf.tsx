import React from 'react';
import { CheckSquare, Square } from 'lucide-react';

interface Feature {
    name: string;
    enabled: boolean;
}

interface ShelfProps {
    features: Feature[];
}

export const Shelf: React.FC<ShelfProps> = ({ features }) => {
    return (
        <div className="bg-gradient-to-b from-gray-100 to-gray-200 border-2 border-gray-400 rounded shadow-xl p-6">
            <h3 className="text-base font-bold text-gray-800 mb-4 border-b border-gray-400 pb-2">Corridor Features</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2">
                        {feature.enabled ? (
                            <CheckSquare className="w-4 h-4 text-green-700 flex-shrink-0" />
                        ) : (
                            <Square className="w-4 h-4 text-gray-500 flex-shrink-0" />
                        )}
                        <span className={`text-xs ${feature.enabled ? 'text-gray-900 font-semibold' : 'text-gray-600'}`}>
                            {feature.name}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};
