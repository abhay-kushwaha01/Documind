import React, { useState, useEffect, useRef } from 'react';
import { Search, X, FileText, Loader2, ArrowRight } from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { api } from '../api.ts';

interface SearchResult {
  docId: string;
  docTitle: string;
  pageNumber: number;
  snippet: string;
  score: number;
}

export const QuickSearchModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const { documents, openViewer } = useApp();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  // Debounced search
  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const handler = setTimeout(async () => {
      try {
        const hits = await api.searchKnowledge(query);
        setResults(hits);
      } catch (err) {
        console.error('Search failed:', err);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(handler);
  }, [query]);

  if (!isOpen) return null;

  const handleSelectResult = (r: SearchResult) => {
    const doc = documents.find((d) => d.id === r.docId);
    if (doc) {
      openViewer(doc, r.pageNumber, r.snippet);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 backdrop-blur-2xs p-4 pt-16 md:pt-20">
      <div className="relative w-full max-w-xl rounded border border-slate-300 bg-white text-slate-900 shadow-lg overflow-hidden dark:border-slate-800 dark:bg-[#13161F] dark:text-slate-100">
        {/* Search Input Bar */}
        <div className="flex items-center gap-2.5 border-b border-slate-200 bg-slate-50 px-3 py-2.5 dark:border-slate-800 dark:bg-[#0D1017]">
          <Search className="h-4 w-4 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search across all document text..."
            className="flex-1 bg-transparent text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            onClick={onClose}
            className="rounded border border-slate-200 bg-white px-1.5 py-0.5 font-mono text-[10px] text-slate-400 hover:text-slate-700 dark:border-slate-700 dark:bg-slate-800"
          >
            ESC
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 text-xs">
          {isSearching && (
            <div className="flex items-center justify-center p-6 text-xs text-slate-400 gap-2">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400" />
              <span>Searching document text...</span>
            </div>
          )}

          {!isSearching && query.trim() && results.length === 0 && (
            <div className="p-8 text-center text-xs text-slate-400">
              No matching text passages found in your documents.
            </div>
          )}

          {!query.trim() && (
            <div className="p-3 text-[11px] text-slate-400">
              Type keywords to search across extracted document pages.
            </div>
          )}

          {results.map((r, i) => (
            <button
              key={i}
              onClick={() => handleSelectResult(r)}
              className="group flex w-full flex-col items-start rounded p-2.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800/40 transition"
            >
              <div className="flex items-center gap-1.5 text-xs">
                <FileText className="h-3 w-3 text-slate-400 shrink-0" />
                <span className="font-semibold text-slate-900 dark:text-slate-100 group-hover:underline">
                  {r.docTitle}
                </span>
                <span className="font-mono text-[10px] text-slate-400">· Page {r.pageNumber}</span>
              </div>
              <p className="mt-0.5 text-[11px] text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                "{r.snippet}"
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
