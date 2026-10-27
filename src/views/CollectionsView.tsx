import React, { useState } from 'react';
import {
  Folder,
  Trash2,
  BookOpen,
  Plus,
  FileText,
  X,
  Star,
  Download,
} from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { api } from '../api.ts';

export const CollectionsView: React.FC = () => {
  const { collections, documents, openViewer, refreshData, showToast, toggleFavorite } = useApp();

  const [activeCollectionId, setActiveCollectionId] = useState<string>(collections[0]?.id || '');
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const activeCol = collections.find((c) => c.id === activeCollectionId) || collections[0];
  const colDocs = documents.filter((d) => d.collectionId === activeCol?.id);

  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    try {
      const created = await api.createCollection(newName.trim(), newDesc.trim(), '#64748B');
      await refreshData();
      setActiveCollectionId(created.id);
      setIsCreating(false);
      setNewName('');
      setNewDesc('');
      showToast('Collection created', 'success');
    } catch {
      showToast('Failed to create collection', 'error');
    }
  };

  const handleDeleteCollection = async (id: string) => {
    if (confirm('Delete this collection? Contained documents will remain in your library.')) {
      try {
        await api.deleteCollection(id);
        await refreshData();
        setActiveCollectionId(collections.find((c) => c.id !== id)?.id || '');
        showToast('Collection removed', 'info');
      } catch {
        showToast('Failed to delete collection', 'error');
      }
    }
  };

  return (
    <div className="space-y-4 pb-12">
      <div className="flex items-center justify-between border-b border-slate-200 pb-3 dark:border-slate-800">
        <div>
          <h2 className="text-xs font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
            Collections
          </h2>
          <p className="text-[11px] text-slate-500">
            Organize documents into categorized folders
          </p>
        </div>

        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-1.5 rounded border border-slate-900 bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800 dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white transition"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>New Collection</span>
        </button>
      </div>

      {/* Creation Modal */}
      {isCreating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-2xs p-4">
          <form
            onSubmit={handleCreateCollection}
            className="w-full max-w-sm rounded border border-slate-200 bg-white p-5 text-slate-900 shadow-md dark:border-slate-800 dark:bg-[#13161F] dark:text-slate-100 space-y-3"
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-2 dark:border-slate-800">
              <h3 className="text-xs font-semibold">New Collection</h3>
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div>
              <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1 block">Name</label>
              <input
                type="text"
                placeholder="e.g. Technical Whitepapers"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
                className="w-full rounded border border-slate-200 bg-white p-1.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1 block">Description</label>
              <input
                type="text"
                placeholder="Optional notes about this collection..."
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                className="w-full rounded border border-slate-200 bg-white p-1.5 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 focus:outline-hidden"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="rounded border border-slate-200 px-3 py-1 text-xs text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded bg-slate-900 px-3 py-1 text-xs font-medium text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900"
              >
                Create
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Collections Split Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Collections List */}
        <div className="space-y-1.5">
          {collections.map((col) => {
            const count = documents.filter((d) => d.collectionId === col.id).length;
            const isActive = activeCol?.id === col.id;

            return (
              <div
                key={col.id}
                onClick={() => setActiveCollectionId(col.id)}
                className={`flex items-center justify-between rounded border p-2.5 text-xs cursor-pointer transition ${
                  isActive
                    ? 'border-slate-400 bg-slate-100/70 text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-white font-medium'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-[#0F1219] dark:text-slate-300 dark:hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <Folder className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{col.name}</span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-mono text-[11px] text-slate-400 tabular-nums">
                    {count}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteCollection(col.id);
                    }}
                    className="text-slate-400 hover:text-rose-500 p-0.5"
                    title="Delete collection"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Collection Documents View */}
        <div className="md:col-span-2 rounded border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-[#0F1219]">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                {activeCol ? activeCol.name : 'No Collection Selected'}
              </h3>
              {activeCol?.description && (
                <p className="text-[11px] text-slate-500">{activeCol.description}</p>
              )}
            </div>
            <span className="font-mono text-[11px] text-slate-500 tabular-nums">
              {colDocs.length} document{colDocs.length === 1 ? '' : 's'}
            </span>
          </div>

          <div className="mt-3 space-y-1.5">
            {colDocs.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No documents currently assigned to this collection.
              </div>
            ) : (
              colDocs.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between rounded border border-slate-100 bg-slate-50/50 p-2.5 text-xs dark:border-slate-800 dark:bg-slate-900/40 hover:bg-slate-100 dark:hover:bg-slate-800/40 transition"
                >
                  <div className="flex items-center gap-2 truncate pr-3">
                    <FileText className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span
                      onClick={() => openViewer(doc)}
                      className="font-medium text-slate-900 hover:underline dark:text-slate-100 cursor-pointer truncate"
                    >
                      {doc.title}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => toggleFavorite(doc.id)}
                      className={`p-1 text-slate-400 hover:text-amber-500 ${
                        doc.isFavorite ? 'text-amber-500 fill-amber-500' : ''
                      }`}
                    >
                      <Star className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => openViewer(doc)}
                      className="rounded border border-slate-200 bg-white px-2 py-0.5 text-[11px] text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                    >
                      View
                    </button>
                    <a
                      href={`/api/documents/${doc.id}/download`}
                      download={doc.filename}
                      className="rounded border border-slate-200 bg-white p-1 text-slate-500 hover:text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400"
                      title="Download"
                    >
                      <Download className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
