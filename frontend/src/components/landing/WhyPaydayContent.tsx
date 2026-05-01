import React from 'react';
import { Check, X } from 'lucide-react';

interface WhyCorridorContentProps {
    data: any;
}

export const WhyCorridorContent: React.FC<WhyCorridorContentProps> = ({ data }) => {
    return (
        <div className="p-8 overflow-y-auto">
            {/* Hero */}
            <div className="text-center mb-12">
                <div className="text-6xl mb-4">{data.hero.emoji}</div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">{data.hero.title}</h2>
                <p className="text-lg text-gray-600">{data.hero.subtitle}</p>
            </div>

            {/* Reasons */}
            <div className="grid md:grid-cols-2 gap-6 mb-12">
                {data.reasons.map((reason: any, index: number) => (
                    <div
                        key={index}
                        className="bg-gradient-to-br from-white to-gray-50 rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow"
                    >
                        <div className="text-4xl mb-3">{reason.emoji}</div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">{reason.title}</h3>
                        <p className="text-sm text-gray-700 mb-3">{reason.description}</p>
                        <div className="inline-block bg-blue-100 text-blue-800 text-xs font-semibold px-3 py-1 rounded-full">
                            {reason.stat}
                        </div>
                    </div>
                ))}
            </div>

            {/* Comparison */}
            <div className="bg-gray-50 rounded-xl p-8 border border-gray-200">
                <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">{data.comparison.title}</h3>
                <div className="grid md:grid-cols-2 gap-8">
                    {/* Traditional */}
                    <div>
                        <h4 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                            <X className="w-5 h-5 text-red-500" />
                            {data.comparison.traditional.label}
                        </h4>
                        <ul className="space-y-3">
                            {data.comparison.traditional.items.map((item: string, index: number) => (
                                <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                                    <X className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Corridor */}
                    <div>
                        <h4 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                            <Check className="w-5 h-5 text-green-500" />
                            {data.comparison.corridor.label}
                        </h4>
                        <ul className="space-y-3">
                            {data.comparison.corridor.items.map((item: string, index: number) => (
                                <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                                    <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};
