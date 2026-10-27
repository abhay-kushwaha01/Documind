import React, { useState } from 'react';
import {
  Search,
  Star,
  Trash2,
  BookOpen,
  MessageSquare,
  AlignLeft,
  Download,
  RotateCw,
  Plus,
  FileText,
  Check,
  Edit2,
  Folder,
  ArrowUpDown,
} from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { api } from '../api.ts';
import { DocumentRecord } from '../types.ts';

interface DocumentsViewProps {
  filterMode?: 'all' | 'recent' | 'favorites';
}

export const DocumentsView: React.FC<DocumentsViewProps> = ({ filterMode = 'all' }) => {
  const {
    documents,
    collections,
    openViewer,
    setActiveTab,
    setActiveDocument,
    toggleFavorite,
    deleteDocument,
    setIsUploadOpen,
    showToast,
    refreshData,
  } = useApp();

  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedCollection, setSelectedCollection] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'size' | 'pages'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Inline rename state
  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  // Filtering
  const filtered = documents.filter((doc) => {
    if (filterMode === 'favorites' && !doc.isFavorite) return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      const matchTitle = doc.title.toLowerCase().includes(q);
      const matchFilename = doc.filename.toLowerCase().includes(q);
      const matchTag = doc.tags?.some((t) => t.toLowerCase().includes(q));
      if (!matchTitle && !matchFilename && !matchTag) return false;
    }

    if (selectedType !== 'all' && doc.extension.toLowerCase() !== selectedType.toLowerCase()) {
      return false;
    }

    if (selectedCollection !== 'all' && doc.collectionId !== selectedCollection) {
      return false;
    }

    return true;
  });

  // Sorting
  const sorted = [...filtered].sort((a, b) => {
    let comparison = 0;
    if (sortBy === 'name') {
      comparison = a.title.localeCompare(b.title);
    } else if (sortBy === 'size') {
      comparison = a.size - b.size;
    } else if (sortBy === 'pages') {
      comparison = (a.pageCount || 0) - (b.pageCount || 0);
    } else {
      // date
      const dateA = filterMode === 'recent' ? (a.lastOpenedAt || a.uploadedAt) : a.uploadedAt;
      const dateB = filterMode === 'recent' ? (b.lastOpenedAt || b.uploadedAt) : b.uploadedAt;
      comparison = new Date(dateA).getTime() - new Date(dateB).getTime();
    }
    return sortOrder === 'desc' ? -comparison : comparison;
  });

  const handleStartRename = (doc: DocumentRecord) => {
    setEditingDocId(doc.id);
    setEditTitle(doc.title);
  };

  const handleSaveRename = async (id: string) => {
    if (!editTitle.trim()) return;
    try {
      await api.updateDocument(id, { title: editTitle.trim() });
      await refreshData();
      setEditingDocId(null);
      showToast('Document renamed', 'success');
    } catch {
      showToast('Failed to rename document', 'error');
    }
  };

  const handleRetry = async (id: string) => {
    try {
      await api.retryDocument(id);
      showToast('Re-processing document extraction...', 'info');
      await refreshData();
    } catch {
      showToast('Retry failed', 'error');
    }
  };

  const handleOpenAction = (doc: DocumentRecord, tab: 'chat' | 'summaries') => {
    setActiveDocument(doc);
    setActiveTab(tab);
  };

  const formatFileSize = (bytes: number): string => {
    if (!bytes || bytes === 0) return '0 KB';
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  const formatDate = (isoString: string): string => {
    if (!isoString) return '—';
    const date = new Date(isoString);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const toggleSort = (field: 'date' | 'name' | 'size' | 'pages') => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const getStatusBadge = (doc: DocumentRecord) => {
    switch (doc.status) {
      case 'ready':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span>Ready</span>
          </span>
        );
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
            <span>Processing</span>
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
            <span>Failed</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
            <span>Uploaded</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-4 pb-12">
      {/* Search and Filters Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3 dark:border-slate-800">
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
          {/* Search Input */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Filter by name, filename, or tag..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 w-full rounded border border-slate-200 bg-white pl-8 pr-3 text-xs text-slate-900 placeholder-slate-400 focus:border-slate-400 focus:outline-hidden dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
            />
          </div>

          {/* Collection Filter */}
          <select
            value={selectedCollection}
            onChange={(e) => setSelectedCollection(e.target.value)}
            className="h-8 rounded border border-slate-200 bg-white px-2.5 text-xs text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
          >
            <option value="all">All Collections</option>
            {collections.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="h-8 rounded border border-slate-200 bg-white px-2.5 text-xs text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
          >
            <option value="all">All Types</option>
            <option value="pdf">PDF</option>
            <option value="docx">DOCX</option>
            <option value="txt">TXT</option>
            <option value="md">Markdown</option>
          </select>
        </div>

        {/* Counter & Upload button */}
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="font-mono tabular-nums">{sorted.length} item{sorted.length === 1 ? '' : 's'}</span>
          <button
            onClick={() => setIsUploadOpen(true)}
            className="flex items-center gap-1.5 rounded border border-slate-900 bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800 dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white transition"
          >
            <Plus className="h-3 w-3" />
            <span>Upload</span>
          </button>
        </div>
      </div>

      {/* Real Document Library Table */}
      {sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded border border-dashed border-slate-200 bg-slate-50/50 p-12 text-center dark:border-slate-800 dark:bg-slate-900/30">
          <FileText className="h-8 w-8 text-slate-400 mb-2" />
          <h3 className="text-xs font-semibold text-slate-800 dark:text-slate-200">
            {filterMode === 'favorites' ? 'No favorite documents' : 'No documents found'}
          </h3>
          <p className="text-[11px] text-slate-500 mt-1 max-w-sm">
            {search || selectedType !== 'all' || selectedCollection !== 'all'
              ? 'No documents match the current search filters.'
              : 'Upload PDF, DOCX, TXT, or Markdown documents to begin processing.'}
          </p>
          <button
            onClick={() => setIsUploadOpen(true)}
            className="mt-3 rounded border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            Upload Document
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded border border-slate-200 bg-white dark:border-slate-800 dark:bg-[#0F1219]">
          <table className="w-full text-left text-xs">
            {/* Table Header */}
            <thead className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-semibold text-slate-500 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-400">
              <tr>
                <th className="w-8 py-2.5 pl-3 pr-1"></th>
                <th
                  onClick={() => toggleSort('name')}
                  className="py-2.5 px-3 cursor-pointer hover:text-slate-900 dark:hover:text-slate-100"
                >
                  <div className="flex items-center gap-1">
                    <span>Name</span>
                    <ArrowUpDown className="h-3 w-3 opacity-50" />
                  </div>
                </th>
                <th className="py-2.5 px-3">Collection</th>
                <th
                  onClick={() => toggleSort('size')}
                  className="py-2.5 px-3 cursor-pointer hover:text-slate-900 dark:hover:text-slate-100 text-right"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Size</span>
                    <ArrowUpDown className="h-3 w-3 opacity-50" />
                  </div>
                </th>
                <th
                  onClick={() => toggleSort('pages')}
                  className="py-2.5 px-3 cursor-pointer hover:text-slate-900 dark:hover:text-slate-100 text-right"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Pages</span>
                    <ArrowUpDown className="h-3 w-3 opacity-50" />
                  </div>
                </th>
                <th
                  onClick={() => toggleSort('date')}
                  className="py-2.5 px-3 cursor-pointer hover:text-slate-900 dark:hover:text-slate-100"
                >
                  <div className="flex items-center gap-1">
                    <span>Date Added</span>
                    <ArrowUpDown className="h-3 w-3 opacity-50" />
                  </div>
                </th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right pr-4">Actions</th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {sorted.map((doc) => {
                const col = collections.find((c) => c.id === doc.collectionId);
                const isEditing = editingDocId === doc.id;

                return (
                  <tr
                    key={doc.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors group"
                  >
                    {/* Star Favorite */}
                    <td className="py-2.5 pl-3 pr-1 text-center">
                      <button
                        onClick={() => toggleFavorite(doc.id)}
                        className={`p-0.5 text-slate-300 hover:text-amber-500 dark:text-slate-600 transition ${
                          doc.isFavorite ? 'text-amber-500 fill-amber-500 dark:text-amber-400' : ''
                        }`}
                        title={doc.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                      >
                        <Star className={`h-3.5 w-3.5 ${doc.isFavorite ? 'fill-current' : ''}`} />
                      </button>
                    </td>

                    {/* Document Title & File Info */}
                    <td className="py-2.5 px-3 max-w-xs truncate">
                      {isEditing ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="rounded border border-slate-300 bg-white px-2 py-0.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 focus:outline-hidden"
                            autoFocus
                          />
                          <button
                            onClick={() => handleSaveRename(doc.id)}
                            className="rounded bg-slate-800 p-1 text-white hover:bg-slate-700"
                          >
                            <Check className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 truncate">
                          <span
                            onClick={() => openViewer(doc)}
                            className="font-medium text-slate-900 hover:text-indigo-600 dark:text-slate-100 dark:hover:text-indigo-400 cursor-pointer truncate"
                            title={doc.title}
                          >
                            {doc.title}
                          </span>
                          {doc.isDemo && (
                            <span className="rounded border border-slate-200 bg-slate-100 px-1 py-0.2 text-[10px] text-slate-500 font-mono dark:border-slate-800 dark:bg-slate-800">
                              Sample
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Collection */}
                    <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400">
                      {col ? (
                        <span className="flex items-center gap-1 text-[11px]">
                          <Folder className="h-3 w-3 text-slate-400" />
                          <span>{col.name}</span>
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400">—</span>
                      )}
                    </td>

                    {/* Size */}
                    <td className="py-2.5 px-3 text-right font-mono text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                      {formatFileSize(doc.size)}
                    </td>

                    {/* Pages */}
                    <td className="py-2.5 px-3 text-right font-mono text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                      {doc.pageCount || 1}
                    </td>

                    {/* Date Uploaded */}
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                      {formatDate(doc.uploadedAt)}
                    </td>

                    {/* Status */}
                    <td className="py-2.5 px-3">
                      {getStatusBadge(doc)}
                    </td>

                    {/* Actions */}
                    <td className="py-2.5 px-3 text-right pr-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openViewer(doc)}
                          className="rounded border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleOpenAction(doc, 'chat')}
                          title="Ask AI questions"
                          className="rounded p-1 text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                        >
                          <MessageSquare className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenAction(doc, 'summaries')}
                          title="Summarize document"
                          className="rounded p-1 text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                        >
                          <AlignLeft className="h-3.5 w-3.5" />
                        </button>
                        <a
                          href={`/api/documents/${doc.id}/download`}
                          download={doc.filename}
                          title="Download document file"
                          className="rounded p-1 text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </a>
                        <button
                          onClick={() => handleStartRename(doc)}
                          title="Rename document"
                          className="rounded p-1 text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                        >
                          <Edit2 className="h-3 w-3" />
                        </button>
                        {doc.status === 'failed' && (
                          <button
                            onClick={() => handleRetry(doc.id)}
                            title="Retry extraction"
                            className="rounded p-1 text-amber-500 hover:text-amber-600"
                          >
                            <RotateCw className="h-3 w-3" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteDocument(doc.id)}
                          title="Delete document"
                          className="rounded p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
