import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check } from 'lucide-react';

interface DocsContentProps {
    path: string;
    onContentLoaded?: (markdown: string) => void;
    isDark?: boolean;
}

const docsMemoryCache = new Map<string, string>();
const DOCS_CACHE_PREFIX = 'corridor-docs-cache:v1:';

const getCachedDocContent = (relativePath: string) => {
    const normalizedPath = relativePath.replace(/^\/+/, '').replace(/\/$/, '');
    if (docsMemoryCache.has(normalizedPath)) {
        return docsMemoryCache.get(normalizedPath) || null;
    }

    try {
        const cached = localStorage.getItem(`${DOCS_CACHE_PREFIX}${normalizedPath}`);
        if (cached) {
            docsMemoryCache.set(normalizedPath, cached);
            return cached;
        }
    } catch {
        // Ignore storage access issues and fall back to network fetch.
    }

    return null;
};

const storeDocContent = (relativePath: string, markdown: string) => {
    const normalizedPath = relativePath.replace(/^\/+/, '').replace(/\/$/, '');
    docsMemoryCache.set(normalizedPath, markdown);

    try {
        localStorage.setItem(`${DOCS_CACHE_PREFIX}${normalizedPath}`, markdown);
    } catch {
        // Ignore quota or privacy mode failures.
    }
};

// CodeBlock component to handle copy functionality properly
const CodeBlock: React.FC<{ language: string; children: string; isDark?: boolean }> = ({ language, children, isDark }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(children);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="relative group">
            <button
                onClick={handleCopy}
                className={`absolute right-2 top-2 p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity ${
                    isDark ? 'bg-slate-700 hover:bg-slate-600' : 'bg-slate-200 hover:bg-slate-300'
                }`}
                title="Copy code"
            >
                {copied ? (
                    <Check className="w-4 h-4 text-green-400" />
                ) : (
                    <Copy className={`w-4 h-4 ${isDark ? 'text-slate-300' : 'text-slate-700'}`} />
                )}
            </button>
            <SyntaxHighlighter
                style={vscDarkPlus}
                language={language}
                PreTag="div"
            >
                {children}
            </SyntaxHighlighter>
        </div>
    );
};

export const DocsContent: React.FC<DocsContentProps> = ({ path, onContentLoaded, isDark = false }) => {
    const [content, setContent] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadContent();
    }, [path]);

    const loadContent = async () => {
        setLoading(true);
        setError(null);

        try {
            // Convert path to file path
            // /docs/getting-started/introduction -> getting-started/introduction.md
            // /docs/business/getting-started/welcome -> business/getting-started/welcome.md

            // Remove /docs/ prefix and trailing slash
            let relativePath = path.replace(/^\/docs\/?/, '').replace(/\/$/, '');
            relativePath = relativePath.split('?')[0];

            // Default to overview if empty
            if (!relativePath) {
                relativePath = 'api-reference/overview';
            }

            const cachedContent = getCachedDocContent(relativePath);
            if (cachedContent) {
                setContent(cachedContent);
                onContentLoaded?.(cachedContent);
                return;
            }

            const fetchPath = `/docs-content/${relativePath}.md`;
            const response = await fetch(fetchPath);
            if (response.ok) {
                const text = await response.text();
                const normalized = text.trimStart().toLowerCase();
                if (!normalized.startsWith('<!doctype html') && !normalized.startsWith('<html')) {
                    storeDocContent(relativePath, text);
                    setContent(text);
                    onContentLoaded?.(text);
                    return;
                }
            }

            const indexResponse = await fetch(`/docs-content/${relativePath}/index.md`);
            if (indexResponse.ok) {
                const text = await indexResponse.text();
                const normalized = text.trimStart().toLowerCase();
                if (!normalized.startsWith('<!doctype html') && !normalized.startsWith('<html')) {
                    storeDocContent(relativePath, text);
                    setContent(text);
                    onContentLoaded?.(text);
                    return;
                }
            }

            throw new Error('Content not found');
        } catch (err) {
            console.error('Failed to load content:', err);
            setError('Failed to load documentation content');
            const notFoundContent = `# 404 Not Found\n\nThe documentation page you are looking for could not be found.\n\nPath: ${path}`;
            setContent(notFoundContent);
            onContentLoaded?.(notFoundContent);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="animate-pulse space-y-4">
                <div className={`h-8 rounded w-3/4 ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`}></div>
                <div className={`h-4 rounded w-full ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`}></div>
                <div className={`h-4 rounded w-5/6 ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`}></div>
                <div className={`h-4 rounded w-4/6 ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`}></div>
            </div>
        );
    }

    return (
        <article className={`prose max-w-none leading-7 ${isDark ? 'prose-invert prose-headings:!text-white prose-p:!text-slate-200 prose-li:!text-slate-200 prose-strong:!text-white prose-code:!text-slate-100 prose-hr:!border-slate-700' : 'prose-slate text-slate-700'}`}>
            <ReactMarkdown
                components={{
                    p: ({ children }) => (
                        <p className={isDark ? 'text-slate-200' : 'text-slate-700'}>{children}</p>
                    ),
                    code({ node, inline, className, children, ...props }: any) {
                        const match = /language-(\w+)/.exec(className || '');

                        return !inline && match ? (
                            <CodeBlock language={match[1]} children={String(children).replace(/\n$/, '')} isDark={isDark} />
                        ) : (
                            <code className={`${isDark ? 'bg-slate-800 text-slate-100' : 'bg-slate-100 text-slate-900'} px-1.5 py-0.5 rounded text-sm`} {...props}>
                                {children}
                            </code>
                        );
                    },
                    h1: ({ children }) => (
                        <h1 className={`text-4xl font-bold mb-6 mt-8 ${isDark ? 'text-white' : 'text-slate-900'}`}>{children}</h1>
                    ),
                    h2: ({ children }) => (
                        <h2 className={`text-3xl font-bold mb-4 mt-8 pb-2 border-b ${isDark ? 'text-white border-slate-700' : 'text-slate-900 border-slate-200'}`}>{children}</h2>
                    ),
                    h3: ({ children }) => (
                        <h3 className={`text-2xl font-semibold mb-3 mt-6 ${isDark ? 'text-white' : 'text-slate-900'}`}>{children}</h3>
                    ),
                    a: ({ href, children }) => (
                        <a href={href} className={`${isDark ? 'text-blue-300 hover:text-blue-200' : 'text-blue-600 hover:text-blue-700'} underline`}>
                            {children}
                        </a>
                    ),
                    ul: ({ children }) => (
                        <ul className={`list-disc list-inside space-y-2 my-4 ${isDark ? 'text-slate-200' : ''}`}>{children}</ul>
                    ),
                    ol: ({ children }) => (
                        <ol className={`list-decimal list-inside space-y-2 my-4 ${isDark ? 'text-slate-200' : ''}`}>{children}</ol>
                    ),
                    li: ({ children }) => (
                        <li className={isDark ? 'text-slate-200' : 'text-slate-700'}>{children}</li>
                    ),
                    table: ({ children }) => (
                        <div className="my-6 overflow-x-auto">
                            <table className={`min-w-full border-collapse text-sm ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{children}</table>
                        </div>
                    ),
                    th: ({ children }) => (
                        <th className={`border px-3 py-2 text-left font-semibold ${isDark ? 'border-slate-700 bg-slate-800 text-white' : 'border-slate-200 bg-slate-100 text-slate-900'}`}>{children}</th>
                    ),
                    td: ({ children }) => (
                        <td className={`border px-3 py-2 align-top ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>{children}</td>
                    ),
                    hr: () => (
                        <hr className={isDark ? 'border-slate-700' : 'border-slate-200'} />
                    ),
                    blockquote: ({ children }) => (
                        <blockquote className={`border-l-4 border-blue-500 pl-4 italic my-4 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                            {children}
                        </blockquote>
                    ),
                }}
            >
                {content}
            </ReactMarkdown>
        </article>
    );
};
