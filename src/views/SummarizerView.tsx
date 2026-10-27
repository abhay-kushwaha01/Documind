import React, { useState } from 'react';
import {
  FileText,
  Copy,
  Check,
  Download,
  BookmarkPlus,
  Loader2,
  BookOpen,
} from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { api } from '../api.ts';

export const SummarizerView: React.FC = () => {
  const { documents, activeDocument, setActiveDocument, showToast } = useApp();

  const [selectedDocId, setSelectedDocId] = useState<string>(activeDocument?.id || documents[0]?.id || '');
  const [summaryType, setSummaryType] = useState<string>('executive');
  const [length, setLength] = useState<'short' | 'medium' | 'in-depth'>('medium');
  const [generatedSummary, setGeneratedSummary] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [hasCopied, setHasCopied] = useState<boolean>(false);

  const summaryModes = [
    { id: 'executive', label: 'Executive Summary', desc: 'High-level synthesis with core objectives and strategic impact' },
    { id: 'one-paragraph', label: 'One-Paragraph Summary', desc: 'Dense 3-5 sentence digest for quick review' },
    { id: 'chapter-wise', label: 'Chapter-wise / Page Breakdown', desc: 'Section-by-section breakdown of core arguments' },
    { id: 'key-points', label: 'Key Points & Takeaways', desc: 'Bulleted list of critical findings with page citations' },
    { id: 'definitions', label: 'Important Definitions', desc: 'Glossary of technical terms, formulas, and acronyms' },
    { id: 'conclusions', label: 'Conclusions & Recommendations', desc: 'Final takeaways, next steps, and action items' },
  ];

  const handleGenerate = async () => {
    if (!selectedDocId) {
      showToast('Select a document to summarize', 'info');
      return;
    }

    setIsGenerating(true);
    setGeneratedSummary('');

    try {
      const res = await api.summarizeDocument(selectedDocId, summaryType, length);
      setGeneratedSummary(res.summary);
      showToast('Summary generated', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to generate summary', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    if (!generatedSummary) return;
    navigator.clipboard.writeText(generatedSummary);
    setHasCopied(true);
    showToast('Copied to clipboard', 'success');
    setTimeout(() => setHasCopied(false), 2000);
  };

  const handleSaveAsNote = async () => {
    if (!generatedSummary) return;
    const doc = documents.find((d) => d.id === selectedDocId);
    try {
      await api.saveNote(
        `${summaryType.toUpperCase()}: ${doc?.title || 'Document'}`,
        generatedSummary,
        doc?.title
      );
      showToast('Saved note to archive', 'success');
    } catch {
      showToast('Failed to save note', 'error');
    }
  };

  const handleExport = (format: 'md' | 'txt') => {
    if (!generatedSummary) return;
    const doc = documents.find((d) => d.id === selectedDocId);
    const filename = `${doc?.title || 'summary'}_${summaryType}.${format}`;
    const blob = new Blob([generatedSummary], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename.replace(/\s+/g, '_');
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Exported as .${format}`, 'success');
  };

  const selectedDoc = documents.find((d) => d.id === selectedDocId);

  return (
    <div className="space-y-4 pb-12">
      {/* Top Controls Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: Configuration Form */}
        <div className="rounded border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-[#0F1219] space-y-3">
          <div>
            <label className="text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1 block">
              Source Document
            </label>
            <select
              value={selectedDocId}
              onChange={(e) => {
                setSelectedDocId(e.target.value);
                const d = documents.find((doc) => doc.id === e.target.value);
                if (d) setActiveDocument(d);
              }}
              className="w-full rounded border border-slate-200 bg-white p-2 text-xs text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 focus:outline-hidden"
            >
              {documents
                .filter((d) => d.status === 'ready')
                .map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.title} ({d.pageCount} pgs)
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1 block">
              Summary Mode
            </label>
            <div className="space-y-1">
              {summaryModes.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setSummaryType(m.id)}
                  className={`w-full rounded p-2 text-left text-xs transition border ${
                    summaryType === m.id
                      ? 'border-slate-400 bg-slate-100/70 text-slate-900 font-medium dark:border-slate-600 dark:bg-slate-800 dark:text-white'
                      : 'border-transparent text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-900'
                  }`}
                >
                  <div className="font-medium text-[11px]">{m.label}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">{m.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[11px] font-medium text-slate-500 mb-1 block">
              Detail Level
            </label>
            <select
              value={length}
              onChange={(e) => setLength(e.target.value as any)}
              className="w-full rounded border border-slate-200 bg-white p-1.5 text-xs text-slate-800 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
            >
              <option value="short">Brief</option>
              <option value="medium">Standard</option>
              <option value="in-depth">In-Depth</option>
            </select>
          </div>

          <button
            onClick={handleGenerate}
            disabled={isGenerating || !selectedDocId}
            className="w-full rounded border border-slate-900 bg-slate-900 p-2 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-40 dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white transition"
          >
            {isGenerating ? 'Generating Summary...' : 'Generate Summary'}
          </button>
        </div>

        {/* Right: Output Pane */}
        <div className="lg:col-span-2 flex flex-col rounded border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-[#0F1219] min-h-[460px]">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 text-xs">
              <FileText className="h-4 w-4 text-slate-500" />
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                Summary Output
              </span>
              {selectedDoc && (
                <span className="font-mono text-[11px] text-slate-400">
                  · {selectedDoc.title}
                </span>
              )}
            </div>

            {generatedSummary && (
              <div className="flex items-center gap-1">
                <button
                  onClick={handleCopy}
                  className="rounded border border-slate-200 bg-white px-2 py-0.5 text-[11px] text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                  title="Copy to clipboard"
                >
                  {hasCopied ? <Check className="h-3 w-3 text-emerald-600 inline mr-1" /> : <Copy className="h-3 w-3 inline mr-1" />}
                  <span>Copy</span>
                </button>
                <button
                  onClick={handleSaveAsNote}
                  className="rounded border border-slate-200 bg-white px-2 py-0.5 text-[11px] text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                  title="Save note"
                >
                  <BookmarkPlus className="h-3 w-3 inline mr-1" />
                  <span>Save</span>
                </button>
                <button
                  onClick={() => handleExport('md')}
                  className="rounded border border-slate-200 bg-white px-2 py-0.5 text-[11px] text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                >
                  <Download className="h-3 w-3 inline mr-1" />
                  <span>Export</span>
                </button>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto pt-3">
            {isGenerating ? (
              <div className="flex h-full flex-col items-center justify-center p-8 text-center text-slate-500 text-xs">
                <Loader2 className="h-5 w-5 animate-spin text-slate-400 mb-2" />
                <p>Generating structured summary from document text...</p>
              </div>
            ) : generatedSummary ? (
              <div className="text-xs leading-relaxed whitespace-pre-wrap text-slate-800 dark:text-slate-200">
                {generatedSummary}
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center p-8 text-center text-slate-400 text-xs">
                <FileText className="h-8 w-8 text-slate-300 dark:text-slate-600 mb-2" />
                <p>Select a document and click "Generate Summary".</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
