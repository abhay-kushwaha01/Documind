import express, { type Request, type Response } from 'express';
import multer from 'multer';
import path from 'path';
import dotenv from 'dotenv';
import { extractDocumentText } from './src/server/extractor.ts';
import { Storage, isSupabaseConfigured } from './src/server/storage.ts';
import {
  askDocumentQuestion,
  generateDocumentSummary,
  compareDocuments,
  searchKnowledgeBase,
  isAiConfigured,
} from './src/server/aiService.ts';
import type { DocumentRecord } from './src/server/types.ts';

dotenv.config();

const app = express();
// Environment constraint: Dev server must run on port 3000
const PORT = 3000;

app.use(express.json({ limit: '30mb' }));
app.use(express.urlencoded({ extended: true, limit: '30mb' }));

// Multer memory storage for safe text extraction without permanent temp files
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024, // 25 MB limit per document
  },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const allowed = ['.pdf', '.txt', '.md', '.docx'];
    if (allowed.includes(ext) || file.mimetype.includes('pdf') || file.mimetype.includes('text') || file.mimetype.includes('word')) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type. Please upload PDF, DOCX, or TXT documents.'));
    }
  },
});

// ================= API ROUTES =================

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    app: 'DocuMind AI',
    version: '1.0.0',
    isAiConfigured: isAiConfigured(),
    isSupabaseConfigured,
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/stats', (_req: Request, res: Response) => {
  const stats = Storage.getStats();
  res.json(stats);
});

// Documents
app.get('/api/documents', (_req: Request, res: Response) => {
  const docs = Storage.getDocuments();
  res.json(docs);
});

app.get('/api/documents/:id', (req: Request, res: Response) => {
  const doc = Storage.getDocumentById(req.params.id);
  if (!doc) {
    res.status(404).json({ error: 'Document not found' });
    return;
  }
  res.json(doc);
});

app.post('/api/documents/upload', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    const file = req.file;
    const originalName = file.originalname || 'document.pdf';
    const cleanTitle = originalName.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
    const extension = path.extname(originalName).replace('.', '').toLowerCase();

    // Initial record with processing status
    const docId = `doc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    
    // Save physical file to persistent storage
    let filePath = '';
    try {
      filePath = Storage.saveUploadedFile(docId, originalName, file.buffer);
    } catch (saveErr) {
      console.warn('Could not write physical file to uploads folder:', saveErr);
    }

    const newDoc: DocumentRecord = {
      id: docId,
      title: cleanTitle,
      filename: originalName,
      size: file.size,
      mimeType: file.mimetype,
      extension,
      pageCount: 0,
      wordCount: 0,
      status: 'processing',
      isFavorite: false,
      tags: [extension.toUpperCase()],
      collectionId: (req.body.collectionId as string) || '',
      uploadedAt: new Date().toISOString(),
      pages: [],
      chunks: [],
      fullText: '',
      filePath,
      isDemo: false,
    };

    // Store immediately
    Storage.addDocument(newDoc);

    // Extract text safely
    try {
      const extraction = await extractDocumentText(file.buffer, file.mimetype, originalName);

      if (!extraction.text || extraction.text.trim().length === 0) {
        Storage.updateDocument(docId, {
          status: 'failed',
          errorMessage: 'Document contains no searchable or readable text. Scanned PDFs require searchable text layers.',
        });
        res.status(422).json({
          error: 'Document text extraction yielded empty content. Please provide a document with searchable text.',
          document: Storage.getDocumentById(docId),
        });
        return;
      }

      // Updated with extracted pages and chunks
      const updated = Storage.updateDocument(docId, {
        status: 'ready',
        pages: extraction.pages,
        chunks: extraction.chunks,
        pageCount: extraction.pageCount,
        wordCount: extraction.wordCount,
        fullText: extraction.text,
      });

      res.status(201).json({
        success: true,
        document: updated,
      });
    } catch (extractErr: any) {
      console.error('Extraction error:', extractErr);
      const failed = Storage.updateDocument(docId, {
        status: 'failed',
        errorMessage: extractErr.message || 'Failed to extract text. File may be encrypted, scanned, or corrupted.',
      });
      res.status(422).json({
        error: extractErr.message || 'Text extraction failed',
        document: failed,
      });
    }
  } catch (err: any) {
    console.error('Upload error:', err);
    res.status(500).json({ error: err.message || 'Upload processing error' });
  }
});

// Download original document or extracted text
app.get('/api/documents/:id/download', (req: Request, res: Response) => {
  const doc = Storage.getDocumentById(req.params.id);
  if (!doc) {
    res.status(404).json({ error: 'Document not found' });
    return;
  }

  const filePath = Storage.getUploadedFilePath(doc.id);
  if (filePath) {
    res.download(filePath, doc.filename);
    return;
  }

  // Fallback: send extracted text
  res.setHeader('Content-Disposition', `attachment; filename="${doc.filename}.txt"`);
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.send(doc.fullText || (doc.pages ? doc.pages.map((p) => p.text).join('\n\n') : ''));
});

app.patch('/api/documents/:id', (req: Request, res: Response) => {
  const { title, isFavorite, tags, collectionId } = req.body;
  const updates: Partial<DocumentRecord> = {};
  if (title !== undefined) updates.title = String(title).trim();
  if (isFavorite !== undefined) updates.isFavorite = Boolean(isFavorite);
  if (Array.isArray(tags)) updates.tags = tags;
  if (collectionId !== undefined) updates.collectionId = String(collectionId);

  const updated = Storage.updateDocument(req.params.id, updates);
  if (!updated) {
    res.status(404).json({ error: 'Document not found' });
    return;
  }
  res.json(updated);
});

app.delete('/api/documents/:id', (req: Request, res: Response) => {
  const deleted = Storage.deleteDocument(req.params.id);
  if (!deleted) {
    res.status(404).json({ error: 'Document not found or could not be deleted' });
    return;
  }
  res.json({ success: true, message: 'Document and associated data deleted' });
});

app.post('/api/documents/retry/:id', async (req: Request, res: Response) => {
  const doc = Storage.getDocumentById(req.params.id);
  if (!doc) {
    res.status(404).json({ error: 'Document not found' });
    return;
  }
  // Reset status to ready if text was already present or update
  const updated = Storage.updateDocument(req.params.id, {
    status: doc.pages.length > 0 ? 'ready' : 'failed',
    errorMessage: doc.pages.length > 0 ? undefined : 'Text could not be extracted. Please re-upload with a clean file.',
  });
  res.json(updated);
});

// Collections
app.get('/api/collections', (_req: Request, res: Response) => {
  res.json(Storage.getCollections());
});

app.post('/api/collections', (req: Request, res: Response) => {
  const { name, description } = req.body;
  if (!name) {
    res.status(400).json({ error: 'Collection name is required' });
    return;
  }
  const col = Storage.addCollection(name, description || '');
  res.status(201).json(col);
});

app.delete('/api/collections/:id', (req: Request, res: Response) => {
  Storage.deleteCollection(req.params.id);
  res.json({ success: true });
});

// AI Chat
app.get('/api/chats', (_req: Request, res: Response) => {
  res.json(Storage.getChats());
});

app.delete('/api/chats', (req: Request, res: Response) => {
  const docId = req.query.documentId as string | undefined;
  Storage.clearChats(docId);
  res.json({ success: true, message: 'Chat history cleared' });
});

app.post('/api/ai/chat', async (req: Request, res: Response) => {
  try {
    const { documentIds, message, mode } = req.body;
    if (!message || typeof message !== 'string') {
      res.status(400).json({ error: 'Message is required' });
      return;
    }

    const docIds: string[] = Array.isArray(documentIds) && documentIds.length > 0
      ? documentIds
      : Storage.getDocuments().filter((d) => d.status === 'ready').map((d) => d.id).slice(0, 3);

    const targetDocs = Storage.getDocuments().filter((d) => docIds.includes(d.id));

    if (targetDocs.length === 0) {
      res.status(400).json({ error: 'No ready documents selected to query' });
      return;
    }

    // Record user message
    const userMsg = Storage.addChat({
      id: `chat-${Date.now()}-u`,
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
      documentIds: docIds,
    });

    // Ask AI
    const result = await askDocumentQuestion(targetDocs, message, [], mode);

    // Record assistant message
    const assistantMsg = Storage.addChat({
      id: `chat-${Date.now()}-a`,
      role: 'assistant',
      content: result.answer,
      timestamp: new Date().toISOString(),
      documentIds: docIds,
      citations: result.citations,
    });

    res.json({
      userMessage: userMsg,
      assistantMessage: assistantMsg,
      citations: result.citations,
    });
  } catch (err: any) {
    console.error('Chat endpoint error:', err);
    res.status(500).json({ error: err.message || 'Chat generation error' });
  }
});

// Summarizer
app.post('/api/ai/summarize', async (req: Request, res: Response) => {
  try {
    const { documentId, summaryType, length, language } = req.body;
    if (!documentId) {
      res.status(400).json({ error: 'documentId is required' });
      return;
    }

    const doc = Storage.getDocumentById(documentId);
    if (!doc) {
      res.status(404).json({ error: 'Document not found' });
      return;
    }

    const summary = await generateDocumentSummary(
      doc,
      summaryType || 'detailed',
      length || 'medium',
      language || 'English'
    );

    const record = Storage.addSummary({
      id: `sum-${Date.now()}`,
      docId: doc.id,
      docTitle: doc.title,
      summaryType: summaryType || 'detailed',
      content: summary,
      createdAt: new Date().toISOString(),
    });

    res.json({
      summary,
      record,
    });
  } catch (err: any) {
    console.error('Summarize error:', err);
    res.status(500).json({ error: err.message || 'Failed to generate summary' });
  }
});

// Document Comparison
app.post('/api/ai/compare', async (req: Request, res: Response) => {
  try {
    const { documentIds, focus } = req.body;
    if (!Array.isArray(documentIds) || documentIds.length < 2) {
      res.status(400).json({ error: 'Please select at least 2 documents to compare' });
      return;
    }

    const docs = Storage.getDocuments().filter((d) => documentIds.includes(d.id));
    if (docs.length < 2) {
      res.status(400).json({ error: 'Could not find the selected documents' });
      return;
    }

    const comparison = await compareDocuments(docs, focus || 'all');
    res.json({ comparison });
  } catch (err: any) {
    console.error('Compare error:', err);
    res.status(500).json({ error: err.message || 'Failed to compare documents' });
  }
});

// Saved Notes
app.get('/api/notes', (_req: Request, res: Response) => {
  res.json(Storage.getNotes());
});

app.post('/api/notes', (req: Request, res: Response) => {
  const { title, content, sourceDocTitle } = req.body;
  if (!content) {
    res.status(400).json({ error: 'Content is required' });
    return;
  }
  const note = Storage.addNote(title || 'Note', content, sourceDocTitle);
  res.status(201).json(note);
});

app.delete('/api/notes/:id', (req: Request, res: Response) => {
  Storage.deleteNote(req.params.id);
  res.json({ success: true });
});

// AI Knowledge Search
app.get('/api/ai/search', async (req: Request, res: Response) => {
  try {
    const query = String(req.query.q || '').trim();
    if (!query) {
      res.json([]);
      return;
    }
    const docs = Storage.getDocuments().filter((d) => d.status === 'ready');
    const results = await searchKnowledgeBase(docs, query);
    res.json(results);
  } catch (err: any) {
    console.error('Search error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ================= VITE DEV MIDDLEWARE & PRODUCTION STATIC =================

async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 DocuMind AI Server running on port ${PORT} (dev: ${isDev})`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
