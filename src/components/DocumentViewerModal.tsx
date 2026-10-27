import React, { useState, useEffect } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Search,
  MessageSquare,
  Send,
  Download,
  Copy,
  Check,
  FileText,
} from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { api } from '../api.ts';
import { CitationBadge } from './CitationBadge.tsx';
import { ChatMessage } from '../types.ts';

export const DocumentViewerModal: React.FC = () => {
  const { viewerState, closeViewer, showToast } = useApp();
  const { isOpen, document: doc, targetPage, highlightText } = viewerState;

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSideChatOpen, setIsSideChatOpen] = useState<boolean>(true);

  // Side Chat state
  const [chatInput, setChatInput] = useState<string>('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isAsking, setIsAsking] = useState<boolean>(false);
  const [hasCopied, setHasCopied] = useState<boolean>(false);

  useEffect(() => {
    if (doc) {
      setCurrentPage(Math.min(targetPage || 1, doc.pageCount || 1));
      if (highlightText) {
        setSearchQuery(highlightText.slice(0, 30));
      }
    }
  }, [doc, targetPage, highlightText]);

  if (!isOpen || !doc) return null;

  const totalPages = doc.pageCount || doc.pages?.length || 1;
  const activePageData = doc.pages?.find((p) => p.pageNumber === currentPage) || doc.pages?.[0];
  const pageContent = activePageData?.text || 'No searchable text extracted for this page.';

  const handlePrevPage = () => setCurrentPage((p) => Math.max(1, p - 1));
  const handleNextPage = () => setCurrentPage((p) => Math.min(totalPages, p + 1));
  const handleZoomIn = () => setZoomLevel((z) => Math.min(150, z + 15));
  const handleZoomOut = () => setZoomLevel((z) => Math.max(75, z - 15));
  const handleResetZoom = () => setZoomLevel(100);

  const handleCopyPageText = () => {
    navigator.clipboard.writeText(pageContent);
    setHasCopied(true);
    showToast('Page content copied', 'success');
    setTimeout(() => setHasCopied(false), 2000);
  };

  const handleSendSideChat = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim() || isAsking) return;

    const userQ = chatInput.trim();
    setChatInput('');
    setIsAsking(true);

    const tempUserMsg: ChatMessage = {
      id: `side-user-${Date.now()}`,
      role: 'user',
      content: userQ,
      timestamp: new Date().toISOString(),
    };
    setChatMessages((prev) => [...prev, tempUserMsg]);

    try {
      const res = await api.askChat([doc.id], userQ, 'grounded');
      setChatMessages((prev) => [...prev, res.assistantMessage]);
    } catch (err: any) {
      showToast(err.message || 'Failed to get answer', 'error');
    } finally {
      setIsAsking(false);
    }
  };

  const renderHighlightedText = (text: string, query: string) => {
    if (!query.trim()) return text;
    try {
      const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
      return parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={i} className="bg-amber-200 text-slate-900 rounded-2xs px-0.5">
            {part}
          </mark>
        ) : (
          part
        )
      );
    } catch {
      return text;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-2xs p-3 md:p-6">
      <div className="relative flex h-[92vh] w-full max-w-6xl flex-col rounded border border-slate-300 bg-white text-slate-900 shadow-xl overflow-hidden dark:border-slate-800 dark:bg-[#0F1219] dark:text-slate-100">
        {/* Top Control Bar */}
        <div className="flex h-12 items-center justify-between border-b border-slate-200 bg-slate-50 px-4 dark:border-slate-800 dark:bg-[#13161F]">
          {/* Document Title */}
          <div className="flex items-center gap-2 truncate pr-4">
            <FileText className="h-4 w-4 shrink-0 text-slate-500" />
            <span className="truncate text-xs font-semibold">{doc.title}</span>
            <span className="shrink-0 font-mono text-[11px] text-slate-400">
              ({doc.extension.toUpperCase()} · {doc.pageCount} pgs)
            </span>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-1.5">
            {/* Search Input */}
            <div className="relative hidden md:flex items-center">
              <Search className="absolute left-2 h-3 w-3 text-slate-400" />
              <input
                type="text"
                placeholder="Find in page..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-7 w-36 rounded border border-slate-200 bg-white pl-6 pr-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 focus:outline-hidden"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            {/* Zoom Controls */}
            <div className="hidden sm:flex items-center gap-0.5 rounded border border-slate-200 bg-white p-0.5 text-xs dark:border-slate-700 dark:bg-slate-900">
              <button
                onClick={handleZoomOut}
                title="Zoom Out"
                className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
              >
                <ZoomOut className="h-3 w-3" />
              </button>
              <span className="w-9 text-center font-mono text-[10px] text-slate-500">
                {zoomLevel}%
              </span>
              <button
                onClick={handleZoomIn}
                title="Zoom In"
                className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
              >
                <ZoomIn className="h-3 w-3" />
              </button>
              <button
                onClick={handleResetZoom}
                title="Reset Zoom"
                className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
              >
                <RotateCcw className="h-3 w-3" />
              </button>
            </div>

            {/* Toggle Side Chat */}
            <button
              onClick={() => setIsSideChatOpen((o) => !o)}
              className={`flex items-center gap-1 rounded border px-2.5 py-1 text-xs font-medium transition ${
                isSideChatOpen
                  ? 'border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'
              }`}
            >
              <MessageSquare className="h-3 w-3" />
              <span>Q&A</span>
            </button>

            {/* Copy Page */}
            <button
              onClick={handleCopyPageText}
              title="Copy page text"
              className="flex h-7 w-7 items-center justify-center rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
            >
              {hasCopied ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
            </button>

            {/* Download */}
            <a
              href={`/api/documents/${doc.id}/download`}
              download={doc.filename}
              title="Download file"
              className="flex h-7 w-7 items-center justify-center rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
            >
              <Download className="h-3 w-3" />
            </a>

            {/* Close */}
            <button
              onClick={closeViewer}
              className="flex h-7 w-7 items-center justify-center rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Main Body */}
        <div className="flex flex-1 overflow-hidden">
          {/* Document Content Viewport */}
          <div className="flex flex-1 flex-col overflow-hidden bg-slate-100 dark:bg-[#090C12]">
            {/* Page Navigator */}
            <div className="flex h-9 items-center justify-between border-b border-slate-200 bg-white px-4 text-xs dark:border-slate-800 dark:bg-[#0F1219]">
              <div className="flex items-center gap-1.5">
                <button
                  disabled={currentPage <= 1}
                  onClick={handlePrevPage}
                  className="flex items-center gap-0.5 rounded border border-slate-200 bg-white px-2 py-0.5 text-slate-600 hover:bg-slate-50 disabled:opacity-30 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  <span>Prev</span>
                </button>
                <div className="flex items-center gap-1 font-mono text-[11px] text-slate-500">
                  <span>Page</span>
                  <select
                    value={currentPage}
                    onChange={(e) => setCurrentPage(Number(e.target.value))}
                    className="rounded border border-slate-200 bg-white px-1 py-0.5 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                  >
                    {Array.from({ length: totalPages }).map((_, idx) => (
                      <option key={idx + 1} value={idx + 1}>
                        {idx + 1}
                      </option>
                    ))}
                  </select>
                  <span>of {totalPages}</span>
                </div>
                <button
                  disabled={currentPage >= totalPages}
                  onClick={handleNextPage}
                  className="flex items-center gap-0.5 rounded border border-slate-200 bg-white px-2 py-0.5 text-slate-600 hover:bg-slate-50 disabled:opacity-30 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                >
                  <span>Next</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="font-mono text-[11px] text-slate-400">
                {activePageData?.text.split(/\s+/).filter(Boolean).length || 0} words
              </div>
            </div>

            {/* Document Sheet Surface */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8 flex justify-center">
              <div
                style={{ fontSize: `${(zoomLevel / 100) * 14}px` }}
                className="w-full max-w-3xl rounded border border-slate-200 bg-white p-8 text-slate-800 shadow-2xs leading-relaxed dark:border-slate-800 dark:bg-[#13161F] dark:text-slate-200 transition-all font-sans"
              >
                <div className="border-b border-slate-100 pb-2 mb-4 flex justify-between text-[11px] font-mono text-slate-400 dark:border-slate-800">
                  <span>{doc.title}</span>
                  <span>Page {currentPage} of {totalPages}</span>
                </div>

                <div className="whitespace-pre-wrap">
                  {renderHighlightedText(pageContent, searchQuery)}
                </div>
              </div>
            </div>
          </div>

          {/* Side AI Chat Panel */}
          {isSideChatOpen && (
            <div className="flex w-88 flex-col border-l border-slate-200 bg-white dark:border-slate-800 dark:bg-[#0F1219]">
              {/* Chat Header */}
              <div className="flex h-9 items-center justify-between border-b border-slate-200 bg-slate-50 px-3 text-xs dark:border-slate-800 dark:bg-[#13161F]">
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  Ask Document
                </span>
                <span className="font-mono text-[10px] text-slate-400">Page {currentPage}</span>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-3 space-y-3 text-xs">
                {chatMessages.length === 0 ? (
                  <div className="p-4 text-center text-slate-400">
                    <p className="font-medium text-slate-600 dark:text-slate-300 text-xs">
                      Ask a question about this file
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Answers will cite verified excerpts from extracted text.
                    </p>
                  </div>
                ) : (
                  chatMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex flex-col rounded p-2 text-xs ${
                        msg.role === 'user'
                          ? 'ml-4 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                          : 'mr-4 border border-slate-200 bg-slate-50 text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100'
                      }`}
                    >
                      <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                      {msg.citations && msg.citations.length > 0 && (
                        <div className="mt-2 border-t border-slate-200 dark:border-slate-800 pt-1 flex flex-wrap gap-1">
                          {msg.citations.map((c, i) => (
                            <CitationBadge key={i} citation={c} />
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
                {isAsking && (
                  <div className="mr-4 flex items-center gap-2 rounded border border-slate-200 bg-slate-50 p-2 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900">
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-pulse" />
                    <span>Analyzing document text...</span>
                  </div>
                )}
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSendSideChat} className="border-t border-slate-200 p-2 dark:border-slate-800">
                <div className="flex items-center gap-1 rounded border border-slate-200 bg-white px-2 py-1 dark:border-slate-700 dark:bg-slate-900">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Ask about this document..."
                    className="flex-1 bg-transparent text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden"
                  />
                  <button
                    type="submit"
                    disabled={!chatInput.trim() || isAsking}
                    className="rounded p-1 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white disabled:opacity-40"
                  >
                    <Send className="h-3 w-3" />
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
