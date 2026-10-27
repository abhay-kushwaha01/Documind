import {
  DocumentRecord,
  CollectionRecord,
  ChatMessage,
  SavedNote,
  SummaryRecord,
  DashboardStats,
} from './types.ts';

const API_BASE = '/api';

export const api = {
  async getHealth(): Promise<{ status: string; isAiConfigured: boolean; isSupabaseConfigured: boolean }> {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) throw new Error('Health check failed');
    return res.json();
  },

  async getStats(): Promise<DashboardStats> {
    const res = await fetch(`${API_BASE}/stats`);
    if (!res.ok) throw new Error('Failed to load stats');
    return res.json();
  },

  async getDocuments(): Promise<DocumentRecord[]> {
    const res = await fetch(`${API_BASE}/documents`);
    if (!res.ok) throw new Error('Failed to load documents');
    return res.json();
  },

  async getDocument(id: string): Promise<DocumentRecord> {
    const res = await fetch(`${API_BASE}/documents/${id}`);
    if (!res.ok) throw new Error('Document not found');
    return res.json();
  },

  async uploadDocument(file: File, collectionId?: string): Promise<{ success: boolean; document: DocumentRecord }> {
    const formData = new FormData();
    formData.append('file', file);
    if (collectionId) {
      formData.append('collectionId', collectionId);
    }

    const res = await fetch(`${API_BASE}/documents/upload`, {
      method: 'POST',
      body: formData,
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to process document');
    }
    return data;
  },

  async updateDocument(id: string, updates: Partial<DocumentRecord>): Promise<DocumentRecord> {
    const res = await fetch(`${API_BASE}/documents/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Failed to update document');
    return res.json();
  },

  async deleteDocument(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/documents/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete document');
  },

  async retryDocument(id: string): Promise<DocumentRecord> {
    const res = await fetch(`${API_BASE}/documents/retry/${id}`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error('Failed to retry document');
    return res.json();
  },

  async getCollections(): Promise<CollectionRecord[]> {
    const res = await fetch(`${API_BASE}/collections`);
    if (!res.ok) throw new Error('Failed to load collections');
    return res.json();
  },

  async createCollection(name: string, description: string, color: string): Promise<CollectionRecord> {
    const res = await fetch(`${API_BASE}/collections`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description, color }),
    });
    if (!res.ok) throw new Error('Failed to create collection');
    return res.json();
  },

  async deleteCollection(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/collections/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete collection');
  },

  async getChats(): Promise<ChatMessage[]> {
    const res = await fetch(`${API_BASE}/chats`);
    if (!res.ok) throw new Error('Failed to load chats');
    return res.json();
  },

  async clearChats(documentId?: string): Promise<void> {
    const url = documentId ? `${API_BASE}/chats?documentId=${documentId}` : `${API_BASE}/chats`;
    const res = await fetch(url, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to clear chats');
  },

  async askChat(
    documentIds: string[],
    message: string,
    mode: 'grounded' | 'simple' | 'comprehensive' = 'grounded'
  ): Promise<{ userMessage: ChatMessage; assistantMessage: ChatMessage }> {
    const res = await fetch(`${API_BASE}/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ documentIds, message, mode }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Chat request failed');
    return data;
  },

  async summarizeDocument(
    documentId: string,
    summaryType: string,
    length = 'medium',
    language = 'English'
  ): Promise<{ summary: string; record: SummaryRecord }> {
    const res = await fetch(`${API_BASE}/ai/summarize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ documentId, summaryType, length, language }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to generate summary');
    return data;
  },

  async compareDocuments(documentIds: string[], focus = 'all'): Promise<{ comparison: string }> {
    const res = await fetch(`${API_BASE}/ai/compare`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ documentIds, focus }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to compare documents');
    return data;
  },



  async getNotes(): Promise<SavedNote[]> {
    const res = await fetch(`${API_BASE}/notes`);
    if (!res.ok) throw new Error('Failed to load notes');
    return res.json();
  },

  async saveNote(title: string, content: string, sourceDocTitle?: string): Promise<SavedNote> {
    const res = await fetch(`${API_BASE}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content, sourceDocTitle }),
    });
    if (!res.ok) throw new Error('Failed to save note');
    return res.json();
  },

  async deleteNote(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/notes/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete note');
  },

  async searchKnowledge(query: string): Promise<Array<{
    docId: string;
    docTitle: string;
    pageNumber: number;
    snippet: string;
    score: number;
  }>> {
    const res = await fetch(`${API_BASE}/ai/search?q=${encodeURIComponent(query)}`);
    if (!res.ok) throw new Error('Search failed');
    return res.json();
  },
};
