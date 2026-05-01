import React, { useState } from 'react';
import { BookOpen, Zap, Settings, Workflow, Plug, GitBranch, Activity, BarChart3, Shield, ChevronRight } from 'lucide-react';

interface HowItWorksContentProps {
    data: any;
}

const iconMap: Record<string, any> = {
    BookOpen, Zap, Settings, Workflow, Plug, GitBranch, Activity, BarChart3, Shield
};

export const HowItWorksContent: React.FC<HowItWorksContentProps> = ({ data }) => {
    const [selectedItem, setSelectedItem] = useState('intro');

    const currentContent = data.content[selectedItem];

    return (
        <div className="flex h-full">
            {/* Sidebar */}
            <div className="w-64 border-r border-gray-200 bg-gray-50 p-4 overflow-y-auto">
                <div className="mb-4">
                    <h4 className="text-sm font-bold text-gray-900 mb-1">{data.sidebar.title}</h4>
                    <p className="text-xs text-gray-600">Complete tutorials and guides</p>
                </div>

                <div className="space-y-4">
                    {data.sidebar.sections.map((section: any, sectionIndex: number) => (
                        <div key={sectionIndex}>
                            <h5 className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                                {section.title}
                            </h5>
                            <div className="space-y-1">
                                {section.items.map((item: any) => {
                                    const Icon = iconMap[item.icon];
                                    const isSelected = selectedItem === item.id;
                                    return (
                                        <button
                                            key={item.id}
                                            onClick={() => setSelectedItem(item.id)}
                                            className={`w-full flex items-center gap-2 px-3 py-2 rounded text-left transition-colors ${isSelected
                                                    ? 'bg-blue-100 text-blue-900 font-medium'
                                                    : 'text-gray-700 hover:bg-gray-100'
                                                }`}
                                        >
                                            <Icon className="w-4 h-4 flex-shrink-0" />
                                            <span className="text-xs flex-1">{item.label}</span>
                                            {isSelected && <ChevronRight className="w-3 h-3" />}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 p-6 overflow-y-auto">
                {currentContent && (
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">{currentContent.title}</h2>

                        <div className="space-y-6">
                            {currentContent.sections?.map((section: any, index: number) => (
                                <div key={index}>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-3">{section.heading}</h3>

                                    {section.content && (
                                        <p className="text-sm text-gray-700 leading-relaxed mb-4">{section.content}</p>
                                    )}

                                    {section.list && (
                                        <ul className="space-y-2">
                                            {section.list.map((item: string, itemIndex: number) => (
                                                <li key={itemIndex} className="flex items-start gap-2 text-sm text-gray-700">
                                                    <span className="text-blue-600 mt-1">✓</span>
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    )}

                                    {section.code && (
                                        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-xs">
                                            <code>{section.code}</code>
                                        </pre>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
