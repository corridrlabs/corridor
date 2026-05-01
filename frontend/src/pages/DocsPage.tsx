import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { DocsSidebar } from '../components/docs/DocsSidebar';
import { DocsContent } from '../components/docs/DocsContent';
import { Helmet } from 'react-helmet-async';
import { Check, ChevronDown, Copy, ExternalLink, Palette } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { getAllPages } from '../data/docs/navigation';

const DocsPage: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [markdown, setMarkdown] = useState('');
    const [copied, setCopied] = useState(false);
    const [openMenu, setOpenMenu] = useState(false);
    const [themeMenuOpen, setThemeMenuOpen] = useState(false);
    const { theme, setTheme, effectiveTheme } = useTheme();
    const isDark = effectiveTheme === 'dark';

    const getCurrentPath = () => {
        return location.pathname + location.search;
    };

    const docsPages = getAllPages();
    const currentIndex = docsPages.findIndex((page) => page.path === location.pathname);
    const previousPage = currentIndex > 0 ? docsPages[currentIndex - 1] : null;
    const nextPage = currentIndex >= 0 && currentIndex < docsPages.length - 1 ? docsPages[currentIndex + 1] : null;

    const handleNavigate = (path: string) => {
        navigate(path);
        setSidebarOpen(false);
    };

    const appUrl = import.meta.env.VITE_APP_URL || window.location.origin;
    const docsAbsoluteUrl = `${appUrl}${location.pathname}${location.search}`;
    const openPrompt = `Read ${docsAbsoluteUrl}, I want to ask questions about it.`;

    const handleCopyMarkdown = async () => {
        await navigator.clipboard.writeText(markdown || '');
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    const openInChatGPT = () => {
        window.open(`https://chatgpt.com/?q=${encodeURIComponent(openPrompt)}`, '_blank', 'noopener,noreferrer');
        setOpenMenu(false);
    };

    const openInClaude = () => {
        window.open(`https://claude.ai/new?q=${encodeURIComponent(openPrompt)}`, '_blank', 'noopener,noreferrer');
        setOpenMenu(false);
    };

    return (
        <>
            <Helmet>
                <title>Documentation - Corridor</title>
                <meta name="description" content="Corridor platform documentation - guides, API reference, and tutorials" />
            </Helmet>

            <div className={`min-h-screen ${isDark ? 'bg-slate-950' : 'bg-white'}`}>
                <div className="fixed right-4 top-4 z-50">
                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => setThemeMenuOpen((v) => !v)}
                            className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold shadow-sm ${
                                isDark ? 'border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                            }`}
                            aria-label="Theme settings"
                        >
                            <Palette className="h-4 w-4" />
                            <ChevronDown className="h-4 w-4" />
                        </button>
                        {themeMenuOpen && (
                            <div className={`absolute right-0 mt-2 w-36 rounded-lg border p-1 shadow-lg ${
                                isDark ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'
                            }`}>
                                {(['light', 'dark', 'system'] as const).map((mode) => (
                                    <button
                                        key={mode}
                                        onClick={() => {
                                            setTheme(mode);
                                            setThemeMenuOpen(false);
                                        }}
                                        className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide ${
                                            theme === mode
                                                ? isDark
                                                    ? 'bg-slate-700 text-white'
                                                    : 'bg-slate-900 text-white'
                                                : isDark
                                                    ? 'text-slate-300 hover:bg-slate-800'
                                                    : 'text-slate-600 hover:bg-slate-100'
                                        }`}
                                    >
                                        {mode}
                                        {theme === mode ? <Check className="h-3.5 w-3.5" /> : null}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
                {/* Mobile sidebar toggle */}
                <div className={`lg:hidden sticky top-0 z-40 px-4 py-3 ${isDark ? 'bg-slate-950 border-b border-slate-800' : 'bg-white border-b border-slate-200'}`}>
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className={`flex items-center gap-2 ${isDark ? 'text-slate-300 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                        Documentation Menu
                    </button>
                </div>

                <div className="flex">
                    {/* Sidebar */}
                    <aside className={`
                        fixed lg:sticky lg:top-0 lg:block
                        w-64 h-screen overflow-y-auto
                        ${isDark ? 'bg-slate-900 border-r border-slate-800' : 'bg-slate-50 border-r border-slate-200'}
                        transition-transform duration-200 ease-in-out
                        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                        z-30 lg:z-0
                    `}>
                        <div className="p-6">
                            <div className="mb-6">
                                <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Documentation</h2>
                                <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Guides and API reference</p>
                            </div>
                            <DocsSidebar currentPath={getCurrentPath()} onNavigate={() => setSidebarOpen(false)} isDark={isDark} />
                        </div>
                    </aside>

                    {/* Overlay for mobile */}
                    {sidebarOpen && (
                        <div
                            className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
                            onClick={() => setSidebarOpen(false)}
                        />
                    )}

                    {/* Main content */}
                    <main className="flex-1 min-w-0">
                        <div className="max-w-4xl mx-auto px-6 py-12">
                            <div className={`mb-5 flex flex-wrap items-center gap-3 border-b pb-4 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                                <button
                                    onClick={handleCopyMarkdown}
                                    className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium ${
                                        isDark ? 'border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                                    }`}
                                >
                                    {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                                    {copied ? 'Copied' : 'Copy Markdown'}
                                </button>

                                <div className="relative">
                                    <button
                                        onClick={() => setOpenMenu((v) => !v)}
                                        className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium ${
                                            isDark ? 'border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                                        }`}
                                    >
                                        Open
                                        <ChevronDown className="h-4 w-4" />
                                    </button>
                                    {openMenu && (
                                        <div className={`absolute left-0 z-20 mt-2 w-52 rounded-lg border p-1 shadow-lg ${isDark ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'}`}>
                                            <button
                                                onClick={openInChatGPT}
                                                className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm ${isDark ? 'text-slate-200 hover:bg-slate-800' : 'text-slate-700 hover:bg-slate-50'}`}
                                            >
                                                Open in ChatGPT
                                                <ExternalLink className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={openInClaude}
                                                className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm ${isDark ? 'text-slate-200 hover:bg-slate-800' : 'text-slate-700 hover:bg-slate-50'}`}
                                            >
                                                Open in Claude
                                                <ExternalLink className="h-4 w-4" />
                                            </button>
                                        </div>
                                    )}
                                </div>

                            </div>

                            <DocsContent path={getCurrentPath()} onContentLoaded={setMarkdown} isDark={isDark} />

                            <div className={`mt-10 flex flex-col gap-3 border-t pt-6 sm:flex-row sm:items-center sm:justify-between ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                                <div className="min-w-0">
                                    {previousPage ? (
                                        <button
                                            type="button"
                                            onClick={() => handleNavigate(previousPage.path)}
                                            className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-3 text-left transition-colors ${
                                                isDark ? 'border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800' : 'border-slate-200 bg-white text-slate-800 hover:bg-slate-50'
                                            }`}
                                        >
                                            <span className="text-sm">Previous</span>
                                            <span className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-950'}`}>{previousPage.title}</span>
                                        </button>
                                    ) : (
                                        <div className={`text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>No previous page</div>
                                    )}
                                </div>

                                <div className="min-w-0 sm:text-right">
                                    {nextPage ? (
                                        <button
                                            type="button"
                                            onClick={() => handleNavigate(nextPage.path)}
                                            className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-3 text-left transition-colors ${
                                                isDark ? 'border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800' : 'border-slate-200 bg-white text-slate-800 hover:bg-slate-50'
                                            }`}
                                        >
                                            <span className="text-sm">Next</span>
                                            <span className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-950'}`}>{nextPage.title}</span>
                                        </button>
                                    ) : (
                                        <div className={`text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>No next page</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        </>
    );
};

export default DocsPage;
