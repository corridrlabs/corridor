import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Map, CreditCard, Users, FileText, Settings, X, ChevronRight, Zap } from 'lucide-react';
import clsx from 'clsx';
import { navigationConfig } from '../config/navigation';

interface SearchDialogProps {
    isOpen: boolean;
    onClose: () => void;
}

interface SearchItem {
    id: string;
    title: string;
    description?: string;
    path: string;
    icon?: any;
    category: string;
}

export const SearchDialog: React.FC<SearchDialogProps> = ({ isOpen, onClose }) => {
    const navigate = useNavigate();
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);

    // Flatten navigation config to search items
    const navItems: SearchItem[] = navigationConfig.flatMap(group =>
        group.items.map(item => ({
            id: item.path,
            title: item.label,
            description: `Navigate to ${item.label}`,
            path: item.path,
            icon: item.icon,
            category: group.title
        }))
    );

    // Add extra quick actions or common pages
    const extraItems: SearchItem[] = [
        { id: 'profile', title: 'User Profile', description: 'Manage your personal settings', path: '/settings?tab=profile', icon: Users, category: 'Settings' },
        { id: 'billing', title: 'Billing & Plans', description: 'View invoices and subscription', path: '/settings?tab=billing', icon: CreditCard, category: 'Settings' },
        { id: 'api-keys', title: 'API Keys', description: 'Manage developer keys', path: '/settings?tab=api-keys', icon: Zap, category: 'Developer' },
        { id: 'create-invoice', title: 'Create Invoice', description: 'Draft a new invoice', path: '/invoices?action=new', icon: FileText, category: 'Actions' },
    ];

    const allItems = [...navItems, ...extraItems];

    const filteredItems = allItems.filter(item =>
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.description?.toLowerCase().includes(query.toLowerCase()) ||
        item.category.toLowerCase().includes(query.toLowerCase())
    );

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 50);
            setQuery('');
            setSelectedIndex(0);
        }
    }, [isOpen]);

    useEffect(() => {
        setSelectedIndex(0);
    }, [query]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => (prev + 1) % filteredItems.length);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => (prev - 1 + filteredItems.length) % filteredItems.length);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (filteredItems[selectedIndex]) {
                handleSelect(filteredItems[selectedIndex]);
            }
        } else if (e.key === 'Escape') {
            onClose();
        }
    };

    const handleSelect = (item: SearchItem) => {
        navigate(item.path);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4">
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={onClose} />

            <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[70vh] animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 bg-white sticky top-0">
                    <Search className="text-slate-400 w-5 h-5" />
                    <input
                        ref={inputRef}
                        type="text"
                        className="flex-1 text-base bg-transparent border-none outline-none text-slate-900 placeholder-slate-400"
                        placeholder="Search for pages, tools, or actions..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />
                    <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 transition-colors">
                        <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-medium text-slate-500 bg-slate-100 border border-slate-200 rounded shadow-sm mr-2">ESC</kbd>
                        <X size={18} />
                    </button>
                </div>

                <div className="overflow-y-auto flex-1 p-2 custom-scrollbar">
                    {filteredItems.length === 0 ? (
                        <div className="py-12 text-center text-slate-500">
                            <Search className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                            <p>No results found for "{query}"</p>
                            <p className="text-sm mt-1 text-slate-400">Try searching for 'Invoices', 'Settings', or 'Team'</p>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {filteredItems.map((item, index) => {
                                const Icon = item.icon || Map;
                                const isSelected = index === selectedIndex;

                                return (
                                    <button
                                        key={`${item.category}-${item.id}`}
                                        className={clsx(
                                            "w-full text-left flex items-center gap-4 px-4 py-3 rounded-lg transition-all duration-75 group",
                                            isSelected ? "bg-blue-50/80 ring-1 ring-blue-500/20" : "hover:bg-slate-50"
                                        )}
                                        onClick={() => handleSelect(item)}
                                        onMouseEnter={() => setSelectedIndex(index)}
                                    >
                                        <div className={clsx(
                                            "p-2 rounded-md transition-colors",
                                            isSelected ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-500 group-hover:bg-white group-hover:shadow-sm"
                                        )}>
                                            <Icon size={20} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className={clsx("font-medium truncate", isSelected ? "text-blue-900" : "text-slate-700")}>
                                                    {item.title}
                                                </span>
                                                <span className="text-xs px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200 uppercase tracking-wide">
                                                    {item.category}
                                                </span>
                                            </div>
                                            {item.description && (
                                                <p className={clsx("text-sm truncate mt-0.5", isSelected ? "text-blue-600/80" : "text-slate-400")}>
                                                    {item.description}
                                                </p>
                                            )}
                                        </div>
                                        {isSelected && <ChevronRight className="w-5 h-5 text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 text-xs text-slate-400 flex justify-between items-center">
                    <span>
                        <span className="font-medium text-slate-600">Pro Tip:</span> Use arrow keys to navigate
                    </span>
                    <div className="flex gap-3">
                        <span className="flex items-center gap-1"><kbd className="font-mono bg-white border border-slate-200 rounded px-1">↵</kbd> to select</span>
                        <span className="flex items-center gap-1"><kbd className="font-mono bg-white border border-slate-200 rounded px-1">↑↓</kbd> to navigate</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
