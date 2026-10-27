import React, { useState } from 'react';
import {
  HardDrive,
  Database,
  ShieldCheck,
  Key,
  Copy,
  Check,
  Trash2,
} from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';

export const SettingsView: React.FC = () => {
  const { stats, isSupabaseConfigured, isAiConfigured, showToast, isDarkMode, toggleTheme } = useApp();
  const [copiedSql, setCopiedSql] = useState(false);

  const supabaseSql = `-- Supabase Schema & Row Level Security (RLS)
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
  uploaded_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users access own documents"
  ON public.documents FOR ALL
  USING (auth.uid() = user_id);`;

  const handleCopySql = () => {
    navigator.clipboard.writeText(supabaseSql);
    setCopiedSql(true);
    showToast('SQL schema copied', 'success');
    setTimeout(() => setCopiedSql(false), 2000);
  };

  return (
    <div className="space-y-4 pb-12 max-w-3xl">
      <div className="border-b border-slate-200 pb-3 dark:border-slate-800">
        <h2 className="text-xs font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
          System & Storage Settings
        </h2>
        <p className="text-[11px] text-slate-500">
          Backend storage engine, model connection, and data retention
        </p>
      </div>

      {/* Persistence Engine Status */}
      <div className="rounded border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-[#0F1219] space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <HardDrive className="h-4 w-4 text-slate-600 dark:text-slate-300" />
            <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-100">
              Storage Engine
            </h3>
          </div>
          <span className="rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-mono text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
            {isSupabaseConfigured ? 'Supabase PostgreSQL' : 'Local Disk Persistence'}
          </span>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          {isSupabaseConfigured
            ? 'Connected to remote Supabase instance. Documents and chat history are synchronized to your cloud database with Row Level Security.'
            : 'DocuMind AI is operating on the server-backed file storage engine. Uploaded files are stored in `.data_store/uploads/` and metadata is preserved in `.data_store/documind_db.json`. Remote Supabase synchronization can be configured by supplying SUPABASE_URL and SUPABASE_KEY in environment variables.'}
        </p>

        {/* Schema setup code block */}
        <div className="rounded border border-slate-200 bg-slate-50 p-3 text-xs dark:border-slate-800 dark:bg-slate-900/60 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
              Supabase Table Schema (Optional)
            </span>
            <button
              onClick={handleCopySql}
              className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-900 dark:hover:text-slate-100"
            >
              {copiedSql ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
              <span>{copiedSql ? 'Copied' : 'Copy SQL'}</span>
            </button>
          </div>
          <pre className="overflow-x-auto text-[11px] font-mono text-slate-600 dark:text-slate-400 p-2 bg-white dark:bg-slate-950 rounded border border-slate-200 dark:border-slate-800">
            {supabaseSql}
          </pre>
        </div>
      </div>

      {/* Model & API Status */}
      <div className="rounded border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-[#0F1219] space-y-2">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Key className="h-4 w-4 text-slate-600 dark:text-slate-300" />
            <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-100">
              Gemini AI Integration
            </h3>
          </div>
          <span className="rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-mono text-emerald-700 dark:border-slate-700 dark:bg-slate-800 dark:text-emerald-400">
            {isAiConfigured ? 'Connected (gemini-3.8-flash)' : 'Local Engine Fallback'}
          </span>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          Reasoning is executed server-side via the modern <code className="font-mono text-slate-800 dark:text-slate-200">@google/genai</code> SDK using <code className="font-mono text-slate-800 dark:text-slate-200">gemini-3.8-flash</code>. API keys are kept strictly on the backend and are never sent to the browser.
        </p>
      </div>

      {/* Data Sovereignty & Deletion Guarantee */}
      <div className="rounded border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-[#0F1219] space-y-2">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
          <ShieldCheck className="h-4 w-4 text-slate-600 dark:text-slate-300" />
          <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-100">
            Security & Document Retention
          </h3>
        </div>

        <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1.5 list-disc list-inside leading-relaxed">
          <li>
            <strong>Permanent Deletion:</strong> Deleting a document removes the physical file from disk and deletes extracted chunks, summaries, and chat references.
          </li>
          <li>
            <strong>Private Storage:</strong> Uploaded files are stored in private server storage and are accessible only through authenticated server routes. No public URLs are generated.
          </li>
          <li>
            <strong>Input Safety:</strong> Document text is treated as untrusted text. Uploaded files are not executed.
          </li>
        </ul>
      </div>

      {/* Interface Theme */}
      <div className="rounded border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-[#0F1219] flex items-center justify-between">
        <div>
          <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-100">Interface Theme</h3>
          <p className="text-[11px] text-slate-500">Toggle between clean light and dark appearances</p>
        </div>
        <button
          onClick={toggleTheme}
          className="rounded border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
        >
          {isDarkMode ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
        </button>
      </div>
    </div>
  );
};
