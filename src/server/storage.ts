import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { sampleDocuments } from './sampleDocs.ts';
import type {
  DocumentRecord,
  CollectionRecord,
  ChatMessage,
  SavedNote,
  SummaryRecord,
} from './types.ts';

const DATA_DIR = path.resolve(process.cwd(), '.data_store');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
const DATA_FILE = path.join(DATA_DIR, 'documind_db.json');

// Ensure storage directories exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

interface StoreState {
  documents: DocumentRecord[];
  collections: CollectionRecord[];
  chats: ChatMessage[];
  notes: SavedNote[];
  summaries: SummaryRecord[];
}

const defaultCollections: CollectionRecord[] = [
  {
    id: 'col-ai',
    name: 'AI & Safety Governance',
    description: 'Alignment research, compliance red-teaming, and safety frameworks.',
    createdAt: new Date(Date.now() - 3600000 * 24 * 7).toISOString(),
  },
  {
    id: 'col-tech',
    name: 'Quantum & Hardware',
    description: 'Qubit architectures, error correction, and cryogenic engineering.',
    createdAt: new Date(Date.now() - 3600000 * 24 * 5).toISOString(),
  },
];

let state: StoreState = {
  documents: [...sampleDocuments],
  collections: [...defaultCollections],
  chats: [],
  notes: [],
  summaries: [],
};

function loadFromDisk() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.documents)) {
        const docMap = new Map<string, DocumentRecord>();
        sampleDocuments.forEach((d) => docMap.set(d.id, d));
        parsed.documents.forEach((d: DocumentRecord) => docMap.set(d.id, d));

        state.documents = Array.from(docMap.values());
        state.collections = parsed.collections?.length ? parsed.collections : defaultCollections;
        state.chats = parsed.chats || [];
        state.notes = parsed.notes || [];
        state.summaries = parsed.summaries || [];
      }
    }
  } catch (err) {
    console.warn('Failed to load storage from disk, using defaults:', err);
  }
}

function saveToDisk() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save store to disk:', err);
  }
}

loadFromDisk();

// Optional Supabase setup
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);
export const supabase = isSupabaseConfigured ? createClient(supabaseUrl!, supabaseKey!) : null;

export const Storage = {
  isSupabaseConfigured,
  uploadsDir: UPLOADS_DIR,

  saveUploadedFile(docId: string, filename: string, buffer: Buffer): string {
    const safeFilename = `${docId}_${filename.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const filePath = path.join(UPLOADS_DIR, safeFilename);
    fs.writeFileSync(filePath, buffer);
    return filePath;
  },

  getUploadedFilePath(docId: string): string | null {
    const doc = this.getDocumentById(docId);
    if (!doc || !doc.filePath) return null;
    if (fs.existsSync(doc.filePath)) return doc.filePath;
    return null;
  },

  getDocuments(): DocumentRecord[] {
    return state.documents;
  },

  getDocumentById(id: string): DocumentRecord | undefined {
    return state.documents.find((d) => d.id === id);
  },

  addDocument(doc: DocumentRecord): DocumentRecord {
    state.documents.unshift(doc);
    saveToDisk();
    return doc;
  },

  updateDocument(id: string, updates: Partial<DocumentRecord>): DocumentRecord | null {
    const idx = state.documents.findIndex((d) => d.id === id);
    if (idx === -1) return null;
    state.documents[idx] = { ...state.documents[idx], ...updates };
    saveToDisk();
    return state.documents[idx];
  },

  deleteDocument(id: string): boolean {
    const doc = state.documents.find((d) => d.id === id);
    if (doc?.filePath && fs.existsSync(doc.filePath)) {
      try {
        fs.unlinkSync(doc.filePath);
      } catch (err) {
        console.warn('Could not remove file from disk:', err);
      }
    }

    const initialLen = state.documents.length;
    state.documents = state.documents.filter((d) => d.id !== id);
    state.chats = state.chats.filter((c) => !c.documentIds?.includes(id));
    state.summaries = state.summaries.filter((s) => s.docId !== id);
    saveToDisk();
    return state.documents.length < initialLen;
  },

  getCollections(): CollectionRecord[] {
    return state.collections.map((c) => ({
      ...c,
      documentCount: state.documents.filter((d) => d.collectionId === c.id).length,
    }));
  },

  addCollection(name: string, description: string): CollectionRecord {
    const col: CollectionRecord = {
      id: `col-${Date.now()}`,
      name: name.trim(),
      description: (description || '').trim(),
      createdAt: new Date().toISOString(),
      documentCount: 0,
    };
    state.collections.push(col);
    saveToDisk();
    return col;
  },

  deleteCollection(id: string): boolean {
    state.collections = state.collections.filter((c) => c.id !== id);
    state.documents.forEach((d) => {
      if (d.collectionId === id) d.collectionId = '';
    });
    saveToDisk();
    return true;
  },

  getChats(): ChatMessage[] {
    return state.chats;
  },

  addChat(message: ChatMessage): ChatMessage {
    state.chats.push(message);
    saveToDisk();
    return message;
  },

  clearChats(documentId?: string): void {
    if (documentId) {
      state.chats = state.chats.filter((c) => !c.documentIds?.includes(documentId));
    } else {
      state.chats = [];
    }
    saveToDisk();
  },

  deleteChat(id: string): boolean {
    state.chats = state.chats.filter((c) => c.id !== id);
    saveToDisk();
    return true;
  },

  getNotes(): SavedNote[] {
    return state.notes;
  },

  addNote(title: string, content: string, sourceDocTitle?: string): SavedNote {
    const note: SavedNote = {
      id: `note-${Date.now()}`,
      title,
      content,
      sourceDocTitle,
      createdAt: new Date().toISOString(),
    };
    state.notes.unshift(note);
    saveToDisk();
    return note;
  },

  deleteNote(id: string): boolean {
    state.notes = state.notes.filter((n) => n.id !== id);
    saveToDisk();
    return true;
  },

  getSummaries(): SummaryRecord[] {
    return state.summaries;
  },

  addSummary(summary: SummaryRecord): SummaryRecord {
    state.summaries.unshift(summary);
    saveToDisk();
    return summary;
  },

  getStats() {
    const totalDocs = state.documents.length;
    const readyDocs = state.documents.filter((d) => d.status === 'ready').length;
    const totalWords = state.documents.reduce((acc, d) => acc + (d.wordCount || 0), 0);
    const totalPages = state.documents.reduce((acc, d) => acc + (d.pageCount || 0), 0);
    const totalQuestions = state.chats.filter((c) => c.role === 'user').length;
    const favorites = state.documents.filter((d) => d.isFavorite).length;

    return {
      totalDocs,
      readyDocs,
      totalWords,
      totalPages,
      totalQuestions,
      favorites,
      notesCount: state.notes.length,
      storageEngine: isSupabaseConfigured ? 'Supabase PostgreSQL' : 'Local File Persistence (.data_store)',
      supabaseStatus: isSupabaseConfigured ? 'connected' : 'local_active',
    };
  },
};
