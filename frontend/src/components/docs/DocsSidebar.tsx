import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { docsNavigation } from '../../data/docs/navigation';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface DocsSidebarProps {
    currentPath: string;
    onNavigate?: () => void;
    isDark?: boolean;
}

export const DocsSidebar: React.FC<DocsSidebarProps> = ({ currentPath, onNavigate, isDark = false }) => {
    const navigate = useNavigate();
    const [expandedSections, setExpandedSections] = useState<string[]>(
        docsNavigation.map(section => section.title)
    );

    const toggleSection = (title: string) => {
        setExpandedSections(prev =>
            prev.includes(title)
                ? prev.filter(t => t !== title)
                : [...prev, title]
        );
    };

    const handleNavigate = (path: string) => {
        navigate(path);
        onNavigate?.();
    };

    return (
        <nav className="space-y-6">
            {docsNavigation.map((section) => {
                const Icon = section.icon;
                const isExpanded = expandedSections.includes(section.title);

                return (
                    <div key={section.title}>
                        <button
                            onClick={() => toggleSection(section.title)}
                            className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left transition-colors ${
                                isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100'
                            }`}
                        >
                            <div className="flex items-center gap-2">
                                <Icon className={`w-4 h-4 ${isDark ? 'text-slate-300' : 'text-slate-600'}`} />
                                <span className={`text-sm font-semibold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{section.title}</span>
                            </div>
                            {isExpanded ? (
                                <ChevronDown className={`w-4 h-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                            ) : (
                                <ChevronRight className={`w-4 h-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                            )}
                        </button>

                        {isExpanded && (
                            <div className="mt-2 ml-6 space-y-1">
                                {section.pages.map((page) => {
                                    const isActive = currentPath === page.path;
                                    return (
                                        <button
                                            key={page.path}
                                            onClick={() => handleNavigate(page.path)}
                                            className={`
                                                block w-full text-left px-3 py-2 rounded-lg text-sm transition-colors
                                                ${isActive
                                                    ? isDark
                                                        ? 'bg-slate-800 text-cyan-200 font-medium'
                                                        : 'bg-blue-50 text-blue-700 font-medium'
                                                    : isDark
                                                        ? 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                                }
                                            `}
                                        >
                                            {page.title}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                );
            })}
        </nav>
    );
};
