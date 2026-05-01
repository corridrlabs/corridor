import React, { useState } from 'react';
import { FileText, Video, BookOpen, ArrowLeft, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface ResourcesContentProps {
    data: any;
}

const typeIcons: Record<string, any> = {
    Guide: FileText,
    Video: Video,
    'Case Study': BookOpen,
    Template: FileText
};

// Eagerly load all markdown files
const markdownFiles = import.meta.glob('../../data/resources/*.md', { as: 'raw', eager: true });

export const ResourcesContent: React.FC<ResourcesContentProps> = ({ data }) => {
    const [selectedResource, setSelectedResource] = useState<any | null>(null);
    const [content, setContent] = useState<string>('');

    const handleResourceClick = (item: any) => {
        const fileName = item.file;
        const filePath = `../../data/resources/${fileName}`;
        const fileContent = markdownFiles[filePath];

        if (fileContent) {
            setContent(fileContent as string);
            setSelectedResource(item);
        } else {
            console.error(`Resource file not found: ${filePath}`);
            setContent('# Error\nResource content not found.');
            setSelectedResource(item);
        }
    };

    const handleBack = () => {
        setSelectedResource(null);
        setContent('');
    };

    if (selectedResource) {
        return (
            <div className="flex flex-col h-full bg-white">
                <div className="flex items-center justify-between p-4 border-b border-gray-200 sticky top-0 bg-white z-10">
                    <button
                        onClick={handleBack}
                        className="flex items-center gap-2 text-slate-600 hover:text-blue-600 transition-colors font-medium"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Resources
                    </button>
                    <div className="text-sm text-slate-500 font-medium">
                        {selectedResource.type} • {selectedResource.duration}
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-8">
                    <div className="max-w-3xl mx-auto prose prose-slate prose-headings:font-bold prose-h1:text-3xl prose-h2:text-2xl prose-a:text-blue-600">
                        <ReactMarkdown
                            components={{
                                code({ node, inline, className, children, ...props }: any) {
                                    const match = /language-(\w+)/.exec(className || '');
                                    return !inline && match ? (
                                        <SyntaxHighlighter
                                            style={vscDarkPlus}
                                            language={match[1]}
                                            PreTag="div"
                                            {...props}
                                        >
                                            {String(children).replace(/\n$/, '')}
                                        </SyntaxHighlighter>
                                    ) : (
                                        <code className={className} {...props}>
                                            {children}
                                        </code>
                                    );
                                }
                            }}
                        >
                            {content}
                        </ReactMarkdown>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 overflow-y-auto h-full bg-slate-50">
            <div className="max-w-5xl mx-auto">
                <div className="mb-10 text-center">
                    <h2 className="text-3xl font-bold text-slate-900 mb-3">{data.title}</h2>
                    <p className="text-lg text-slate-600 max-w-2xl mx-auto">{data.description}</p>
                </div>

                <div className="space-y-10">
                    {data.sections.map((section: any, sectionIndex: number) => (
                        <div key={sectionIndex}>
                            <h3 className="text-xl font-bold text-slate-900 mb-5 flex items-center gap-2">
                                {section.title}
                                <div className="h-px bg-slate-200 flex-1 ml-4"></div>
                            </h3>
                            <div className="grid md:grid-cols-2 gap-4">
                                {section.items.map((item: any, itemIndex: number) => {
                                    const Icon = typeIcons[item.type] || FileText;
                                    return (
                                        <div
                                            key={itemIndex}
                                            onClick={() => handleResourceClick(item)}
                                            className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-lg hover:border-blue-300 transition-all cursor-pointer group"
                                        >
                                            <div className="flex items-start gap-4">
                                                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-blue-100 transition-colors">
                                                    <Icon className="w-6 h-6 text-blue-600" />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-start justify-between mb-2">
                                                        <h4 className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{item.name}</h4>
                                                    </div>
                                                    {item.description && (
                                                        <p className="text-sm text-slate-600 mb-3 line-clamp-2">{item.description}</p>
                                                    )}
                                                    <div className="flex items-center gap-3 text-xs text-slate-500">
                                                        <span className="bg-slate-100 px-2 py-1 rounded font-medium">
                                                            {item.type}
                                                        </span>
                                                        <span>{item.duration}</span>
                                                        {item.company && (
                                                            <>
                                                                <span>•</span>
                                                                <span>{item.company}</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
