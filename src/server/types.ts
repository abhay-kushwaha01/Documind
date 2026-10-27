export interface ExtractedPage {
  pageNumber: number;
  text: string;
}

export type DocumentProcessingStatus = 'uploaded' | 'processing' | 'ready' | 'failed';

export interface DocumentChunk {
  chunkId: string;
  pageNumber: number;
  text: string;
  wordCount: number;
}

export interface DocumentRecord {
  id: string;
  title: string;
  filename: string;
  size: number;
  mimeType: string;
  extension: string;
  pageCount: number;
  wordCount: number;
  status: DocumentProcessingStatus;
  errorMessage?: string;
  isFavorite: boolean;
  tags: string[];
  collectionId: string;
  uploadedAt: string;
  lastOpenedAt?: string;
  isDemo?: boolean;
  pages: ExtractedPage[];
  chunks?: DocumentChunk[];
  fullText: string;
  filePath?: string;
  summary?: string;
}

export interface CollectionRecord {
  id: string;
  name: string;
  description: string;
  color?: string;
  createdAt: string;
  documentCount?: number;
}

export interface Citation {
  docId: string;
  docTitle: string;
  pageNumber: number;
  excerpt: string;
  confidence?: 'direct' | 'contextual';
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  citations?: Citation[];
  documentIds?: string[];
}

export interface SavedNote {
  id: string;
  title: string;
  content: string;
  sourceDocTitle?: string;
  createdAt: string;
}

export interface SummaryRecord {
  id: string;
  docId: string;
  docTitle: string;
  summaryType: string;
  content: string;
  createdAt: string;
}

export type ActiveTab =
  | 'documents'
  | 'recent'
  | 'favorites'
  | 'collections'
  | 'chat'
  | 'summaries'
  | 'settings';
