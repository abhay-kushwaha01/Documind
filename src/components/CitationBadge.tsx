import React, { useState } from 'react';
import { BookOpen } from 'lucide-react';
import { Citation } from '../types.ts';
import { useApp } from '../context/AppContext.tsx';

interface CitationBadgeProps {
  citation: Citation;
}

export const CitationBadge: React.FC<CitationBadgeProps> = ({ citation }) => {
  const { documents, openViewer } = useApp();
  const [showTooltip, setShowTooltip] = useState(false);

  const handleClick = () => {
    const doc = documents.find(
      (d) =>
        d.id === citation.docId ||
        d.title.toLowerCase().includes(citation.docTitle.toLowerCase()) ||
        citation.docTitle.toLowerCase().includes(d.title.toLowerCase())
    );

    if (doc) {
      openViewer(doc, citation.pageNumber, citation.excerpt);
    }
  };

  return (
    <span className="relative inline-block my-0.5 mr-1 align-middle">
      <button
        type="button"
        onClick={handleClick}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="inline-flex items-center gap-1 rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-mono text-slate-700 hover:border-slate-400 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-slate-600 transition"
        title="Jump to source page"
      >
        <BookOpen className="h-2.5 w-2.5 text-slate-400" />
        <span className="max-w-[120px] truncate">{citation.docTitle}</span>
        <span>p.{citation.pageNumber}</span>
      </button>

      {/* Excerpt Tooltip */}
      {showTooltip && citation.excerpt && (
        <div className="absolute bottom-full left-0 z-30 mb-1.5 w-64 rounded border border-slate-300 bg-white p-2 text-xs text-slate-800 shadow-md dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
          <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Grounded Excerpt (Page {citation.pageNumber})
          </div>
          <p className="line-clamp-3 text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
            "{citation.excerpt}"
          </p>
        </div>
      )}
    </span>
  );
};
