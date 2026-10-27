import React from 'react';
import {
  FileText,
  Clock,
  Star,
  Folder,
  MessageSquare,
  AlignLeft,
  Settings,
  Plus,
  HardDrive,
  CheckCircle2,
} from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { ActiveTab } from '../types.ts';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { activeTab, setActiveTab, documents, setIsUploadOpen, stats, isSupabaseConfigured } = useApp();

  const favoritesCount = documents.filter((d) => d.isFavorite).length;

  const navItems: Array<{ id: ActiveTab; label: string; icon: React.ComponentType<{ className?: string }>; count?: number }> = [
    { id: 'documents', label: 'Documents', icon: FileText, count: documents.length },
    { id: 'recent', label: 'Recent', icon: Clock },
    { id: 'favorites', label: 'Favorites', icon: Star, count: favoritesCount > 0 ? favoritesCount : undefined },
    { id: 'collections', label: 'Collections', icon: Folder },
    { id: 'chat', label: 'AI Chat', icon: MessageSquare },
    { id: 'summaries', label: 'Summaries', icon: AlignLeft },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleSelect = (tab: ActiveTab) => {
    setActiveTab(tab);
    onClose();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-xs md:hidden"
          onClick={onClose}
        />
      )}

      {/* Clean, Understated Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-60 flex-col border-r border-slate-200 bg-slate-50/70 text-slate-800 transition-transform duration-150 ease-out md:static md:translate-x-0 dark:border-slate-800 dark:bg-[#0D1017] dark:text-slate-200 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header - Simple Understated Wordmark */}
        <div className="flex h-13 items-center justify-between border-b border-slate-200/80 px-4 dark:border-slate-800/80">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded border border-slate-300 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
              <FileText className="h-3.5 w-3.5" />
            </div>
            <span className="text-sm font-semibold tracking-tight text-slate-900 dark:text-white">
              DocuMind AI
            </span>
          </div>
        </div>

        {/* Action Button: Upload Document */}
        <div className="p-3">
          <button
            onClick={() => {
              setIsUploadOpen(true);
              onClose();
            }}
            className="flex w-full items-center justify-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 shadow-2xs hover:bg-slate-100 hover:border-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700 transition"
          >
            <Plus className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
            <span>Upload Document</span>
          </button>
        </div>

        {/* Navigation Section */}
        <nav className="flex-1 space-y-0.5 px-2 py-1 overflow-y-auto">
          <div className="px-2.5 pb-1.5 pt-1 text-[11px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Workspace
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id)}
                className={`flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-xs font-medium transition ${
                  isActive
                    ? 'bg-slate-200/70 text-slate-900 dark:bg-slate-800/90 dark:text-white font-semibold'
                    : 'text-slate-600 hover:bg-slate-200/40 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={`h-4 w-4 ${
                      isActive
                        ? 'text-slate-900 dark:text-slate-100'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.count !== undefined && (
                  <span className="font-mono text-[11px] text-slate-400 tabular-nums">
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Quiet Footer: Storage Status */}
        <div className="border-t border-slate-200/80 p-3 text-[11px] text-slate-500 dark:border-slate-800/80 dark:text-slate-400">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-medium">
              <HardDrive className="h-3 w-3 text-slate-400" />
              <span>{isSupabaseConfigured ? 'Supabase Sync' : 'Local Storage'}</span>
            </span>
            <span className="font-mono tabular-nums">{documents.length} docs</span>
          </div>
          <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400">
            <span>{stats?.totalWords ? stats.totalWords.toLocaleString() : '0'} words indexed</span>
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-2.5 w-2.5" />
              <span>Ready</span>
            </span>
          </div>
        </div>
      </aside>
    </>
  );
};
