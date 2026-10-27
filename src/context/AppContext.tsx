import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  DocumentRecord,
  CollectionRecord,
  ChatMessage,
  SavedNote,
  DashboardStats,
  ActiveTab,
} from '../types.ts';
import { api } from '../api.ts';

interface AppContextType {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  documents: DocumentRecord[];
  collections: CollectionRecord[];
  stats: DashboardStats | null;
  loadingDocs: boolean;
  activeDocument: DocumentRecord | null;
  setActiveDocument: (doc: DocumentRecord | null) => void;
  selectedDocIds: string[];
  setSelectedDocIds: React.Dispatch<React.SetStateAction<string[]>>;
  toggleSelectDoc: (id: string) => void;
  // Document Viewer Modal
  viewerState: {
    isOpen: boolean;
    document: DocumentRecord | null;
    targetPage: number;
    highlightText?: string;
  };
  openViewer: (doc: DocumentRecord, pageNumber?: number, highlightText?: string) => void;
  closeViewer: () => void;
  // Upload Modal
  isUploadOpen: boolean;
  setIsUploadOpen: (open: boolean) => void;
  // Theme
  isDarkMode: boolean;
  toggleTheme: () => void;
  // Actions & Refresh
  refreshData: () => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  deleteDocument: (id: string) => Promise<void>;
  // Toast notifications
  toast: { message: string; type: 'success' | 'error' | 'info' } | null;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  // Storage & AI engine status
  isAiConfigured: boolean;
  isSupabaseConfigured: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Default to 'documents' table workspace per design brief
  const [activeTab, setActiveTab] = useState<ActiveTab>('documents');
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [collections, setCollections] = useState<CollectionRecord[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loadingDocs, setLoadingDocs] = useState<boolean>(true);
  const [activeDocument, setActiveDocument] = useState<DocumentRecord | null>(null);
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);

  const [isAiConfigured, setIsAiConfigured] = useState<boolean>(true);
  const [isSupabaseConfigured, setIsSupabaseConfigured] = useState<boolean>(false);

  // Viewer state
  const [viewerState, setViewerState] = useState<{
    isOpen: boolean;
    document: DocumentRecord | null;
    targetPage: number;
    highlightText?: string;
  }>({
    isOpen: false,
    document: null,
    targetPage: 1,
  });

  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Theme - clean light/dark mode support with persistent local storage
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('documind_theme');
    if (saved) return saved === 'dark';
    return false; // Default clean neutral light theme per brief
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('documind_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('documind_theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode((prev) => !prev);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((curr) => (curr?.message === message ? null : curr));
    }, 3500);
  }, []);

  const refreshData = useCallback(async () => {
    try {
      const [docsData, colsData, statsData, healthData] = await Promise.all([
        api.getDocuments(),
        api.getCollections(),
        api.getStats(),
        api.getHealth(),
      ]);
      setDocuments(docsData);
      setCollections(colsData);
      setStats(statsData);
      setIsAiConfigured(healthData.isAiConfigured);
      setIsSupabaseConfigured(healthData.isSupabaseConfigured);

      // Select first document if none active
      if (docsData.length > 0) {
        setActiveDocument((curr) => {
          if (curr && docsData.find((d) => d.id === curr.id)) return curr;
          return docsData.find((d) => d.status === 'ready') || docsData[0];
        });

        setSelectedDocIds((curr) => {
          if (curr.length > 0) return curr;
          const readyFirst = docsData.filter((d) => d.status === 'ready').slice(0, 1).map((d) => d.id);
          return readyFirst;
        });
      }
    } catch (err: any) {
      console.error('Error syncing app data:', err);
    } finally {
      setLoadingDocs(false);
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const toggleSelectDoc = (id: string) => {
    setSelectedDocIds((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );
  };

  const openViewer = (doc: DocumentRecord, pageNumber = 1, highlightText?: string) => {
    // Record last opened timestamp
    api.updateDocument(doc.id, { lastOpenedAt: new Date().toISOString() }).catch(() => {});
    setViewerState({
      isOpen: true,
      document: doc,
      targetPage: pageNumber,
      highlightText,
    });
  };

  const closeViewer = () => {
    setViewerState((prev) => ({ ...prev, isOpen: false }));
  };

  const toggleFavorite = async (id: string) => {
    const doc = documents.find((d) => d.id === id);
    if (!doc) return;
    try {
      const updated = await api.updateDocument(id, { isFavorite: !doc.isFavorite });
      setDocuments((prev) => prev.map((d) => (d.id === id ? updated : d)));
      showToast(updated.isFavorite ? 'Added to favorites' : 'Removed from favorites', 'success');
    } catch {
      showToast('Could not update favorite', 'error');
    }
  };

  const deleteDocument = async (id: string) => {
    try {
      await api.deleteDocument(id);
      setDocuments((prev) => prev.filter((d) => d.id !== id));
      setSelectedDocIds((prev) => prev.filter((d) => d !== id));
      if (activeDocument?.id === id) {
        const remaining = documents.filter((d) => d.id !== id);
        setActiveDocument(remaining[0] || null);
      }
      showToast('Document deleted permanently', 'success');
      refreshData();
    } catch {
      showToast('Failed to delete document', 'error');
    }
  };

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        documents,
        collections,
        stats,
        loadingDocs,
        activeDocument,
        setActiveDocument,
        selectedDocIds,
        setSelectedDocIds,
        toggleSelectDoc,
        viewerState,
        openViewer,
        closeViewer,
        isUploadOpen,
        setIsUploadOpen,
        isDarkMode,
        toggleTheme,
        refreshData,
        toggleFavorite,
        deleteDocument,
        toast,
        showToast,
        isAiConfigured,
        isSupabaseConfigured,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
