import React, { useState, useMemo } from 'react';
import { Search, ChevronRight, FileText, Users, Zap, Globe, RefreshCcw, Building, Clock, CreditCard, Link as LinkIcon, GitBranch, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { documentationData, DocItem, searchDocs } from '../data/documentation';

const ICONS: Record<string, React.FC<any>> = {
  FileText, Users, Zap, Globe, RefreshCcw, Building, Clock, CreditCard, Link: LinkIcon, GitBranch,
};

interface DocDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DocDropdown: React.FC<DocDropdownProps> = ({ isOpen, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  // Filter docs based on search
  const filteredDocs = useMemo(() => {
    if (!searchQuery.trim()) return documentationData;
    return searchDocs(searchQuery);
  }, [searchQuery]);

  const handleDocClick = (doc: DocItem, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onClose();
    navigate(`/docs?product=${doc.id}`);
  };

  if (!isOpen) return null;

  return (
    <div className="absolute top-[80px] left-1/2 -translate-x-1/2 w-[600px] bg-white border border-slate-200 rounded-2xl shadow-2xl shadow-slate-200/50 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
      {/* Search */}
      <div className="p-4 border-b border-slate-100">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search features..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Results count */}
      <div className="px-4 py-2 text-xs text-slate-500 flex items-center justify-between">
        <span>{filteredDocs.length} features</span>
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="text-blue-600 hover:underline"
          >
            Clear search
          </button>
        )}
      </div>

      {/* Items list - show all, no pagination */}
      <div className="max-h-[350px] overflow-y-auto p-3">
        <div className="grid grid-cols-2 gap-2">
          {filteredDocs.map((doc) => {
            const IconComponent = ICONS[doc.icon] || FileText;
            return (
              <button
                key={doc.id}
                onClick={(e) => handleDocClick(doc, e)}
                className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors text-left group"
              >
                <div className="p-2 rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-100 transition-colors shrink-0">
                  <IconComponent size={16} />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-slate-900 text-sm">{doc.title}</div>
                  <div className="text-xs text-slate-500 leading-tight">{doc.description}</div>
                </div>
                <ExternalLink size={14} className="text-slate-400 shrink-0 mt-1" />
              </button>
            );
          })}
        </div>

        {filteredDocs.length === 0 && (
          <div className="text-center py-8 text-slate-500">
            No features found for "{searchQuery}"
          </div>
        )}
      </div>
    </div>
  );
};
