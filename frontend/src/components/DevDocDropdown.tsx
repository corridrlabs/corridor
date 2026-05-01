import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, ChevronRight, Terminal, Code, BookOpen, Puzzle, Activity, Rocket, Download, Database, Wallet, Layers, Cpu, Globe, ArrowRight, ExternalLink, Package, Wrench, TestTube, Key } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export interface DevDoc {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'getting-started' | 'core-concepts' | 'official-sdks' | 'community-sdks' | 'api-reference' | 'tools';
  url: string;
}

export const developerDocs: DevDoc[] = [
  // Getting Started
  {
    id: 'quickstart',
    title: 'Quickstart',
    description: 'Build your first payment integration in minutes',
    icon: 'Rocket',
    category: 'getting-started',
    url: '/docs/developers#quickstart',
  },
  {
    id: 'setup',
    title: 'Setup Local Environment',
    description: 'Install dependencies and configure your development environment',
    icon: 'Download',
    category: 'getting-started',
    url: '/docs/setup',
  },
  {
    id: 'authentication',
    title: 'Authentication',
    description: 'Secure your API requests with API keys and JWT tokens',
    icon: 'Key',
    category: 'getting-started',
    url: '/docs/authentication',
  },
  // Core Concepts
  {
    id: 'accounts',
    title: 'Accounts',
    description: 'Understand user accounts, wallets, and identity management',
    icon: 'Wallet',
    category: 'core-concepts',
    url: '/docs/accounts',
  },
  {
    id: 'transactions',
    title: 'Transactions',
    description: 'Process payments, transfers, and ledger entries',
    icon: 'Layers',
    category: 'core-concepts',
    url: '/docs/transactions',
  },
  {
    id: 'fees',
    title: 'Fees & Pricing',
    description: 'Understand transaction fees, margins, and pricing models',
    icon: 'Database',
    category: 'core-concepts',
    url: '/docs/fees',
  },
  {
    id: 'webhooks',
    title: 'Webhooks',
    description: 'Receive real-time notifications for payment events',
    icon: 'Activity',
    category: 'core-concepts',
    url: '/docs/webhooks',
  },
  // Official SDKs
  {
    id: 'js-sdk',
    title: 'JavaScript/TypeScript SDK',
    description: 'Official SDK for Node.js and browser applications',
    icon: 'Code',
    category: 'official-sdks',
    url: '/docs/sdks/javascript',
  },
  {
    id: 'react-sdk',
    title: 'React SDK',
    description: 'React hooks and components for building payment UIs',
    icon: 'Puzzle',
    category: 'official-sdks',
    url: '/docs/sdks/react',
  },
  {
    id: 'rust-sdk',
    title: 'Rust SDK',
    description: 'Official SDK for Rust applications',
    icon: 'Cpu',
    category: 'official-sdks',
    url: '/docs/sdks/rust',
  },
  // Community SDKs
  {
    id: 'python-sdk',
    title: 'Python SDK',
    description: 'Community Python SDK by Solvers',
    icon: 'Code',
    category: 'community-sdks',
    url: 'https://pypi.org/project/corridor/',
  },
  {
    id: 'go-sdk',
    title: 'Go SDK',
    description: 'Community Go SDK by gala-go',
    icon: 'Code',
    category: 'community-sdks',
    url: 'https://github.com/gala-go/corridor-go',
  },
  // API Reference
  {
    id: 'api-reference',
    title: 'API Reference',
    description: 'Complete REST API endpoint documentation',
    icon: 'BookOpen',
    category: 'api-reference',
    url: '/docs/api/reference',
  },
  {
    id: 'errors',
    title: 'Error Codes',
    description: 'Understanding API errors and how to handle them',
    icon: 'Activity',
    category: 'api-reference',
    url: '/docs/api/errors',
  },
  // Tools
  {
    id: 'postman',
    title: 'Postman Collection',
    description: 'Ready-to-use Postman templates for testing',
    icon: 'Package',
    category: 'tools',
    url: '/docs/tools/postman',
  },
  {
    id: 'sandbox',
    title: 'Sandbox Environment',
    description: 'Test with fake money in our sandbox',
    icon: 'TestTube',
    category: 'tools',
    url: '/docs/tools/sandbox',
  },
  {
    id: 'cli',
    title: 'CLI Tool',
    description: 'Command-line interface for common operations',
    icon: 'Terminal',
    category: 'tools',
    url: '/docs/tools/cli',
  },
  {
    id: 'vscode',
    title: 'VS Code Extension',
    description: 'IDE extensions and snippets',
    icon: 'Wrench',
    category: 'tools',
    url: '/docs/tools/vscode',
  }
];

const ICONS: Record<string, React.FC<any>> = {
  Rocket, Download, Key, Wallet, Layers, Database, Activity, Code, Puzzle, Cpu, BookOpen, Package, TestTube, Terminal, Wrench
};

const CATEGORY_LABELS: Record<DevDoc['category'], string> = {
  'getting-started': 'Getting Started',
  'core-concepts': 'Core Concepts',
  'official-sdks': 'Official SDKs',
  'community-sdks': 'Community SDKs',
  'api-reference': 'API Reference',
  'tools': 'Tools'
};

interface DevDocDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DevDocDropdown: React.FC<DevDocDropdownProps> = ({ isOpen, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<DevDoc['category'] | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const filteredDocs = useMemo(() => {
    let docs = developerDocs;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      docs = docs.filter(doc =>
        doc.title.toLowerCase().includes(q) ||
        doc.description.toLowerCase().includes(q)
      );
    }
    if (categoryFilter) {
      docs = docs.filter(doc => doc.category === categoryFilter);
    }
    return docs;
  }, [searchQuery, categoryFilter]);

  const categories = [...new Set(developerDocs.map(d => d.category))];

  const handleDocClick = (doc: DevDoc, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onClose();
    navigate(`/docs?section=${doc.id}`);
  };

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      className="absolute top-[80px] left-1/2 -translate-x-1/2 w-[580px] bg-white border border-slate-200 rounded-2xl shadow-2xl shadow-slate-200/50 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200"
    >
      <div className="p-4 border-b border-slate-100">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search docs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
          />
        </div>

        <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
          <button
            onClick={() => setCategoryFilter(null)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
              !categoryFilter
                ? 'bg-purple-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                categoryFilter === cat
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-2 text-xs text-slate-500 flex items-center justify-between">
        <span>{filteredDocs.length} docs</span>
        {(searchQuery || categoryFilter) && (
          <button
            onClick={() => { setSearchQuery(''); setCategoryFilter(null); }}
            className="text-purple-600 hover:underline"
          >
            Clear filters
          </button>
        )}
      </div>

      <div className="max-h-[320px] overflow-y-auto p-3">
        <div className="space-y-1">
          {filteredDocs.map((doc) => {
            const IconComponent = ICONS[doc.icon] || BookOpen;
            return (
              <button
                key={doc.id}
                onClick={(e) => handleDocClick(doc, e)}
                className="w-full flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors text-left group"
              >
                <div className="p-2 rounded-lg bg-purple-50 text-purple-600 group-hover:bg-purple-100 transition-colors shrink-0">
                  <IconComponent size={16} />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-slate-900 text-sm">{doc.title}</div>
                  <div className="text-xs text-slate-500 leading-tight">{doc.description}</div>
                </div>
                <span className="text-xs text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
                  {CATEGORY_LABELS[doc.category]}
                </span>
                <ExternalLink size={14} className="text-slate-400 shrink-0 mt-1" />
              </button>
            );
          })}
        </div>

        {filteredDocs.length === 0 && (
          <div className="text-center py-8 text-slate-500">
            No docs found for "{searchQuery}"
          </div>
        )}
      </div>
    </div>
  );
};
