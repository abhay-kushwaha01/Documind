import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext.tsx';
import { Sidebar } from './components/Sidebar.tsx';
import { Header } from './components/Header.tsx';
import { UploadModal } from './components/UploadModal.tsx';
import { DocumentViewerModal } from './components/DocumentViewerModal.tsx';
import { QuickSearchModal } from './components/QuickSearchModal.tsx';

import { DocumentsView } from './views/DocumentsView.tsx';
import { CollectionsView } from './views/CollectionsView.tsx';
import { ChatView } from './views/ChatView.tsx';
import { SummarizerView } from './views/SummarizerView.tsx';
import { SettingsView } from './views/SettingsView.tsx';

import { Check, AlertCircle, Info } from 'lucide-react';

const MainLayout: React.FC = () => {
  const { activeTab, toast } = useApp();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [quickSearchOpen, setQuickSearchOpen] = useState(false);

  // Global ⌘K keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setQuickSearchOpen((open) => !open);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const renderActiveView = () => {
    switch (activeTab) {
      case 'documents':
        return <DocumentsView filterMode="all" />;
      case 'recent':
        return <DocumentsView filterMode="recent" />;
      case 'favorites':
        return <DocumentsView filterMode="favorites" />;
      case 'collections':
        return <CollectionsView />;
      case 'chat':
        return <ChatView />;
      case 'summaries':
        return <SummarizerView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <DocumentsView filterMode="all" />;
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50 text-slate-900 dark:bg-[#090C12] dark:text-slate-100 font-sans">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main View Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <Header
          onToggleSidebar={() => setSidebarOpen((s) => !s)}
          onOpenQuickSearch={() => setQuickSearchOpen(true)}
        />

        {/* Content Viewport */}
        <main className="flex-1 overflow-y-auto px-4 py-5 md:px-8">
          <div className="mx-auto max-w-6xl">{renderActiveView()}</div>
        </main>
      </div>

      {/* Modals */}
      <UploadModal />
      <DocumentViewerModal />
      <QuickSearchModal isOpen={quickSearchOpen} onClose={() => setQuickSearchOpen(false)} />

      {/* Floating Toast Notification */}
      {toast && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 shadow-md dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100">
          {toast.type === 'success' && <Check className="h-3.5 w-3.5 text-emerald-600" />}
          {toast.type === 'error' && <AlertCircle className="h-3.5 w-3.5 text-rose-600" />}
          {toast.type === 'info' && <Info className="h-3.5 w-3.5 text-slate-600" />}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
