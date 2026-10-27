# DocuMind AI – Your Personal Knowledge Brain
> **"Upload. Understand. Discover."**

DocuMind AI is a production-oriented document intelligence platform designed to extract, index, query, compare, and transform your private documents into interactive study and research assets. Powered by Google Gemini (`gemini-3.8-flash`) and Express.

---

## Key Features

1. **Document Upload & Page Extraction**
   - Drag-and-drop file ingestion for PDF, DOCX, and TXT files.
   - Text parsing with page-level division, word counting, and error detection.
   - Resilient fallback for complex documents with retry mechanics.

2. **Grounded AI Document Chat & Citations**
   - Ask questions across a single document or multiple selected documents simultaneously.
   - Source-grounded answers with interactive citation badges (`[Document, Page #]`).
   - Clicking any citation jumps directly to that page in the Document Viewer and highlights the cited text.
   - 1-click copy and "Save to Personal Notes".

3. **Integrated Document Viewer**
   - Page navigation, zoom in/out, reset, and in-document text search.
   - Split-screen embedded AI chat panel for reading and inquiring side-by-side.

4. **Smart Summarizer**
   - 8 distinct synthesis modes: Executive, One-Paragraph, Chapter-wise, Key Takeaways, Definitions & Terms, Conclusions, and Action Items.
   - Configurable depth (Brief, Standard, In-Depth) and multilingual output.
   - Export to Markdown or TXT.

5. **Multi-Document Comparative Analysis**
   - Select 2+ documents to contrast methodologies, discover shared assumptions, and spot conflicting statements with exact page citations.
   - Markdown comparison matrix tables.

6. **Study Studio**
   - Multiple Choice Question (MCQ) quizzes with live test-taking mode, instant scoring, and explanations.
   - Active recall flip flashcards with category tags and page references.
   - Topic-wise revision notes generator.

7. **Natural Language Knowledge Search (⌘K)**
   - Instant search across all indexed documents and pages with surrounding context snippets.

8. **Collections & Personal Knowledge Library**
   - Organize documents into color-coded topic collections.
   - Star favorites, search by tags or text, and rename or delete documents.

9. **Supabase & Storage Architecture**
   - Local disk persistence fallback (`.data_store/documind_db.json`) for zero-setup execution.
   - Supabase PostgreSQL sync when `SUPABASE_URL` and `SUPABASE_KEY` are provided.

---

## Environment Variables

Copy `.env.example` to `.env` or configure via the Secrets panel:

```env
# GEMINI_API_KEY: Required for Gemini AI API calls.
GEMINI_API_KEY="your-google-gemini-api-key"

# PORT: Port where Express and Vite run.
PORT=3000

# Optional: Supabase configuration for cloud PostgreSQL & Auth
# SUPABASE_URL="https://your-project.supabase.co"
# SUPABASE_KEY="your-supabase-service-role-or-anon-key"
```

---

## Supabase Database Schema (Optional)

If enabling Supabase cloud persistence, run the following SQL migration in your Supabase SQL editor:

```sql
-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Documents table
CREATE TABLE IF NOT EXISTS public.documents (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users DEFAULT auth.uid(),
  title TEXT NOT NULL,
  filename TEXT NOT NULL,
  mime_type TEXT,
  size INTEGER,
  page_count INTEGER,
  word_count INTEGER,
  status TEXT DEFAULT 'ready',
  is_favorite BOOLEAN DEFAULT false,
  collection_id TEXT,
  tags TEXT[],
  uploaded_at TIMESTAMPTZ DEFAULT now()
);

-- Row Level Security (RLS)
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only view their own documents"
  ON public.documents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can only insert their own documents"
  ON public.documents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can only update their own documents"
  ON public.documents FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can only delete their own documents"
  ON public.documents FOR DELETE
  USING (auth.uid() = user_id);
```

---

## Local Development & Run Commands

```bash
# 1. Install dependencies
npm install

# 2. Run full-stack dev server (Express + Vite)
npm run dev

# 3. Type check & build for production
npm run lint
npm run build

# 4. Start production server
npm start
```
