import React from 'react';
import { Menu, Sun, Moon, Search, Plus } from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';

interface HeaderProps {
  onToggleSidebar: () => void;
  onOpenQuickSearch: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar, onOpenQuickSearch }) => {
  const { activeTab, isDarkMode, toggleTheme, setIsUploadOpen } = useApp();

  const tabTitles: Record<string, string> = {
    documents: 'Documents',
    recent: 'Recent Documents',
    favorites: 'Favorites',
    collections: 'Collections',
    chat: 'AI Document Chat',
    summaries: 'Document Summaries',
    settings: 'Settings & Storage',
  };

  return (
    <header className="flex h-13 w-full items-center justify-between border-b border-slate-200 bg-white px-4 md:px-6 dark:border-slate-800 dark:bg-[#0F1219]">
      {/* Left: Mobile Toggle + Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          aria-label="Toggle navigation"
          className="flex h-8 w-8 items-center justify-center rounded border border-slate-200 text-slate-500 hover:bg-slate-100 md:hidden dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
        >
          <Menu className="h-4 w-4" />
        </button>

        <h1 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          {tabTitles[activeTab] || 'Documents'}
        </h1>
      </div>

      {/* Right: Search, Upload, Theme Toggle */}
      <div className="flex items-center gap-2">
        {/* Search trigger */}
        <button
          onClick={onOpenQuickSearch}
          className="hidden sm:flex items-center gap-2 rounded border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-500 hover:border-slate-300 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:border-slate-700 transition"
        >
          <Search className="h-3.5 w-3.5" />
          <span>Search documents...</span>
          <kbd className="rounded border border-slate-200 bg-white px-1 font-mono text-[10px] text-slate-400 dark:border-slate-700 dark:bg-slate-800">
            ⌘K
          </kbd>
        </button>

        {/* Upload Button */}
        <button
          onClick={() => setIsUploadOpen(true)}
          className="flex items-center gap-1.5 rounded border border-slate-900 bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800 dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white transition"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Upload</span>
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          className="flex h-8 w-8 items-center justify-center rounded border border-slate-200 text-slate-500 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 transition"
        >
          {isDarkMode ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
        </button>
      </div>
    </header>
  );
};
