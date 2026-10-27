import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  FileText,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';
import { api } from '../api.ts';

export const UploadModal: React.FC = () => {
  const { isUploadOpen, setIsUploadOpen, collections, refreshData, showToast, openViewer } = useApp();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>('');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [statusStep, setStatusStep] = useState<'idle' | 'uploaded' | 'processing' | 'ready' | 'failed'>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [processedDoc, setProcessedDoc] = useState<any | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isUploadOpen) return null;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (file: File) => {
    setUploadError(null);
    setProcessedDoc(null);
    setStatusStep('idle');

    const ext = file.name.split('.').pop()?.toLowerCase();
    const allowed = ['pdf', 'docx', 'txt', 'md'];

    if (!allowed.includes(ext || '')) {
      setUploadError(`Unsupported file format .${ext}. Please upload PDF, DOCX, TXT, or Markdown.`);
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      setUploadError('File size exceeds 25 MB limit.');
      return;
    }

    setSelectedFile(file);
  };

  const handleStartUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadError(null);
    setStatusStep('uploaded');
    setStatusMessage('Uploading file to server storage...');

    setTimeout(() => {
      setStatusStep('processing');
      setStatusMessage('Extracting document text and page indexes...');
    }, 400);

    try {
      const result = await api.uploadDocument(selectedFile, selectedCollectionId);
      setStatusStep('ready');
      setStatusMessage('Document extracted and ready for analysis.');
      setProcessedDoc(result.document);
      showToast('Document uploaded and extracted', 'success');
      await refreshData();
    } catch (err: any) {
      setStatusStep('failed');
      setUploadError(err.message || 'Text extraction failed. Ensure document has searchable text.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setUploadError(null);
    setProcessedDoc(null);
    setStatusStep('idle');
    setIsUploadOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-2xs p-4">
      <div className="relative w-full max-w-md rounded border border-slate-200 bg-white p-5 text-slate-900 shadow-lg dark:border-slate-800 dark:bg-[#13161F] dark:text-slate-100 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Upload className="h-4 w-4 text-slate-600 dark:text-slate-300" />
            <h2 className="text-xs font-semibold uppercase tracking-wider">Upload Document</h2>
          </div>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body */}
        {!processedDoc ? (
          <div className="space-y-3">
            {/* Dropzone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => !isUploading && fileInputRef.current?.click()}
              className={`flex flex-col items-center justify-center rounded border border-dashed p-6 text-center cursor-pointer transition ${
                isDragging
                  ? 'border-slate-900 bg-slate-100/70 dark:border-slate-100 dark:bg-slate-800'
                  : 'border-slate-300 bg-slate-50/50 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900/40 dark:hover:bg-slate-900'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.txt,.md"
                onChange={handleFileChange}
                className="hidden"
                disabled={isUploading}
              />

              <Upload className="h-6 w-6 text-slate-400 mb-2" />
              <p className="text-xs font-medium text-slate-800 dark:text-slate-200">
                Click to browse or drop file here
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                PDF, DOCX, TXT, MD (Max 25 MB)
              </p>
            </div>

            {/* Selected File Details */}
            {selectedFile && (
              <div className="flex items-center justify-between rounded border border-slate-200 bg-slate-50 p-2.5 text-xs dark:border-slate-700 dark:bg-slate-900">
                <div className="flex items-center gap-2 truncate pr-2">
                  <FileText className="h-4 w-4 text-slate-500 shrink-0" />
                  <div className="truncate">
                    <div className="font-medium truncate">{selectedFile.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {(selectedFile.size / 1024).toFixed(1)} KB
                    </div>
                  </div>
                </div>
                {!isUploading && (
                  <button
                    onClick={() => setSelectedFile(null)}
                    className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            )}

            {/* Collection Assignment */}
            {collections.length > 0 && (
              <div>
                <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1 block">
                  Assign to Collection (Optional)
                </label>
                <select
                  value={selectedCollectionId}
                  onChange={(e) => setSelectedCollectionId(e.target.value)}
                  disabled={isUploading}
                  className="w-full rounded border border-slate-200 bg-white p-1.5 text-xs text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                >
                  <option value="">No Collection</option>
                  {collections.map((col) => (
                    <option key={col.id} value={col.id}>
                      {col.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Status Indicator */}
            {isUploading && (
              <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 pt-1">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-600 dark:text-slate-300" />
                <span>{statusMessage}</span>
              </div>
            )}

            {/* Error Message */}
            {uploadError && (
              <div className="flex items-start gap-2 rounded border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
                <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-medium">Extraction Failed</div>
                  <div className="text-[11px] mt-0.5">{uploadError}</div>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Ready Confirmation */
          <div className="space-y-3 py-2 text-center text-xs">
            <CheckCircle2 className="h-8 w-8 text-emerald-600 mx-auto" />
            <div>
              <div className="font-semibold text-slate-900 dark:text-slate-100">
                Extraction Complete
              </div>
              <p className="text-slate-500 text-[11px] mt-0.5">
                {processedDoc.title} ({processedDoc.pageCount} pages,{' '}
                {processedDoc.wordCount?.toLocaleString()} words)
              </p>
            </div>

            <div className="pt-2 flex justify-center gap-2">
              <button
                onClick={() => {
                  handleClose();
                  openViewer(processedDoc);
                }}
                className="rounded border border-slate-900 bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-800 dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900"
              >
                Open in Viewer
              </button>
              <button
                onClick={() => {
                  setProcessedDoc(null);
                  setSelectedFile(null);
                  setStatusStep('idle');
                }}
                className="rounded border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                Upload Another
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        {!processedDoc && (
          <div className="flex justify-end gap-2 border-t border-slate-200 pt-3 dark:border-slate-800">
            <button
              onClick={handleClose}
              disabled={isUploading}
              className="rounded border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >
              Cancel
            </button>
            <button
              onClick={handleStartUpload}
              disabled={!selectedFile || isUploading}
              className="rounded border border-slate-900 bg-slate-900 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-40 dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900"
            >
              {isUploading ? 'Processing...' : 'Upload & Process'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
