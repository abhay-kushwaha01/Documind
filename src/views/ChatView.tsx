import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  BookOpen,
  Trash2,
  Copy,
  Check,
  BookmarkPlus,
  RotateCcw,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { api } from '../api.ts';
import { CitationBadge } from '../components/CitationBadge.tsx';
import { ChatMessage } from '../types.ts';

export const ChatView: React.FC = () => {
  const {
    documents,
    selectedDocIds,
    setSelectedDocIds,
    toggleSelectDoc,
    showToast,
    isAiConfigured,
  } = useApp();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load chat history from backend
  useEffect(() => {
    api.getChats().then((data) => {
      if (data && Array.isArray(data)) {
        setMessages(data);
      }
    });
  }, []);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Ensure ready document is selected
  useEffect(() => {
    if (selectedDocIds.length === 0 && documents.length > 0) {
      const ready = documents.filter((d) => d.status === 'ready');
      if (ready.length > 0) {
        setSelectedDocIds([ready[0].id]);
      }
    }
  }, [documents, selectedDocIds, setSelectedDocIds]);

  const handleSendMessage = async (customPrompt?: string) => {
    const textToSend = customPrompt || input;
    if (!textToSend.trim() || isLoading) return;

    if (selectedDocIds.length === 0) {
      showToast('Select at least one document to ground answers', 'info');
      return;
    }

    setInput('');
    setIsLoading(true);

    const tempUserMsg: ChatMessage = {
      id: `chat-${Date.now()}-u`,
      role: 'user',
      content: textToSend.trim(),
      timestamp: new Date().toISOString(),
      documentIds: selectedDocIds,
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const res = await api.askChat(selectedDocIds, textToSend.trim(), 'grounded');
      setMessages((prev) => [...prev, res.assistantMessage]);
    } catch (err: any) {
      showToast(err.message || 'Error processing inquiry', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = async () => {
    try {
      await api.clearChats();
      setMessages([]);
      showToast('Chat history cleared', 'info');
    } catch {
      showToast('Failed to clear conversation', 'error');
    }
  };

  const handleCopyMessage = (id: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    showToast('Copied to clipboard', 'success');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSaveAsNote = async (msg: ChatMessage) => {
    try {
      const title = msg.content.slice(0, 45).replace(/[#*`]/g, '').trim() + '...';
      const sourceTitles = documents
        .filter((d) => msg.documentIds?.includes(d.id))
        .map((d) => d.title)
        .join(', ');
      await api.saveNote(title, msg.content, sourceTitles);
      showToast('Saved note to archive', 'success');
    } catch {
      showToast('Failed to save note', 'error');
    }
  };

  const selectedDocs = documents.filter((d) => selectedDocIds.includes(d.id));

  return (
    <div className="flex h-[calc(100vh-8.5rem)] flex-col gap-4 md:flex-row pb-2">
      {/* Document Context Selector (Left Pane) */}
      <div className="flex w-full md:w-64 flex-col rounded border border-slate-200 bg-white p-3 text-xs dark:border-slate-800 dark:bg-[#0F1219] shrink-0">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h2 className="text-xs font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              Document Context
            </h2>
            <p className="text-[11px] text-slate-500">
              {selectedDocs.length} selected
            </p>
          </div>
          <button
            onClick={() => {
              const allReady = documents.filter((d) => d.status === 'ready').map((d) => d.id);
              setSelectedDocIds(selectedDocIds.length === allReady.length ? [] : allReady);
            }}
            className="text-[11px] text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
          >
            {selectedDocIds.length === documents.filter((d) => d.status === 'ready').length
              ? 'Deselect'
              : 'Select all'}
          </button>
        </div>

        {/* Document Checklist */}
        <div className="flex-1 overflow-y-auto space-y-1.5 py-2">
          {documents
            .filter((d) => d.status === 'ready')
            .map((doc) => {
              const isSelected = selectedDocIds.includes(doc.id);
              return (
                <div
                  key={doc.id}
                  onClick={() => toggleSelectDoc(doc.id)}
                  className={`flex items-start gap-2 rounded border p-2 text-xs cursor-pointer transition ${
                    isSelected
                      ? 'border-slate-400 bg-slate-50 text-slate-900 dark:border-slate-600 dark:bg-slate-800/80 dark:text-slate-100'
                      : 'border-slate-200 bg-transparent text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => {}}
                    className="mt-0.5 rounded border-slate-300 text-slate-900 focus:ring-0 dark:border-slate-700"
                  />
                  <div className="truncate flex-1">
                    <div className="truncate font-medium text-[11px]">{doc.title}</div>
                    <div className="mt-0.5 flex items-center gap-1 font-mono text-[10px] text-slate-400">
                      <span>{doc.extension.toUpperCase()}</span>
                      <span>·</span>
                      <span>{doc.pageCount} pgs</span>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>

        {/* Note on Grounding */}
        <div className="border-t border-slate-200 pt-2 text-[11px] text-slate-500 dark:border-slate-800">
          <p className="leading-snug">
            Responses are strictly verified against extracted text from selected documents.
          </p>
        </div>
      </div>

      {/* Main Conversation Stream */}
      <div className="flex flex-1 flex-col rounded border border-slate-200 bg-white dark:border-slate-800 dark:bg-[#0F1219] overflow-hidden">
        {/* Stream Header */}
        <div className="flex h-10 items-center justify-between border-b border-slate-200 px-4 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-slate-900 dark:text-slate-100">Document Q&A</span>
            <span className="text-slate-400">·</span>
            <span className="text-slate-500 font-mono text-[11px]">
              {selectedDocs.length > 0
                ? `${selectedDocs.length} active source${selectedDocs.length === 1 ? '' : 's'}`
                : 'No documents selected'}
            </span>
          </div>

          <button
            onClick={handleClearHistory}
            className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            title="Clear conversation"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Clear</span>
          </button>
        </div>

        {/* Message Log */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center p-6 text-slate-500">
              <FileText className="h-8 w-8 text-slate-400 mb-2" />
              <h3 className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Ask Questions Grounded in Your Documents
              </h3>
              <p className="text-[11px] text-slate-500 mt-1 max-w-sm">
                Inquiries are cross-referenced with exact passages and page numbers.
              </p>

              {/* Sample Inquiries */}
              <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md">
                {[
                  'What are the core findings of this document?',
                  'Summarize the objectives in simple language',
                  'Find all key dates, formulas, and figures',
                  'What recommendations are proposed?',
                ].map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendMessage(prompt)}
                    className="rounded border border-slate-200 bg-slate-50 p-2 text-left text-[11px] text-slate-700 hover:border-slate-300 hover:bg-white dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-300 dark:hover:border-slate-700"
                  >
                    "{prompt}"
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col text-xs leading-relaxed ${
                  msg.role === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`max-w-2xl rounded p-3 text-xs ${
                    msg.role === 'user'
                      ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                      : 'border border-slate-200 bg-slate-50/70 text-slate-900 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-100'
                  }`}
                >
                  <div className="whitespace-pre-wrap leading-relaxed">
                    {msg.content}
                  </div>

                  {/* Render Grounded Citations */}
                  {msg.citations && msg.citations.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-slate-200/80 dark:border-slate-800">
                      <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                        <BookOpen className="h-3 w-3" />
                        <span>Source References</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {msg.citations.map((c, i) => (
                          <CitationBadge key={i} citation={c} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Assistant Actions */}
                  {msg.role === 'assistant' && (
                    <div className="mt-2 flex items-center justify-end gap-1.5 border-t border-slate-200/60 pt-1.5 text-slate-400 dark:border-slate-800/80">
                      <button
                        onClick={() => handleCopyMessage(msg.id, msg.content)}
                        className="rounded p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                        title="Copy answer"
                      >
                        {copiedId === msg.id ? (
                          <Check className="h-3 w-3 text-emerald-600" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </button>
                      <button
                        onClick={() => handleSaveAsNote(msg)}
                        className="rounded p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                        title="Save as note"
                      >
                        <BookmarkPlus className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}

          {isLoading && (
            <div className="flex items-center gap-2 rounded border border-slate-200 bg-slate-50 p-3 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900/60 max-w-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-pulse" />
              <span>Analyzing extracted document passages...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="border-t border-slate-200 p-2.5 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/40"
        >
          <div className="flex items-center gap-2 rounded border border-slate-200 bg-white px-3 py-1.5 dark:border-slate-700 dark:bg-slate-900">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Ask a question grounded in ${selectedDocs.length} selected document(s)...`}
              className="flex-1 bg-transparent text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="flex h-7 w-7 items-center justify-center rounded bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-40 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
