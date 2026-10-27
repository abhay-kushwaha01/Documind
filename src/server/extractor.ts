import mammoth from 'mammoth';

export interface ExtractedPage {
  pageNumber: number;
  text: string;
}

import type { DocumentChunk } from './types.ts';

export interface ExtractionResult {
  text: string;
  pages: ExtractedPage[];
  chunks: DocumentChunk[];
  pageCount: number;
  wordCount: number;
  headings: string[];
}

/**
 * Robust document text extractor for PDF, DOCX, TXT.
 * Splits text into page or section chunks with accurate page number tracking.
 */
export async function extractDocumentText(
  buffer: Buffer,
  mimetype: string,
  filename: string
): Promise<ExtractionResult> {
  const extension = filename.split('.').pop()?.toLowerCase() || '';

  if (mimetype === 'text/plain' || extension === 'txt' || extension === 'md') {
    const rawText = buffer.toString('utf-8');
    return processPlainText(rawText);
  }

  if (
    mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    extension === 'docx'
  ) {
    try {
      const docxResult = await mammoth.extractRawText({ buffer });
      const rawText = docxResult.value || '';
      return processPlainText(rawText, 'DOCX Section');
    } catch (err) {
      console.error('Error extracting DOCX:', err);
      throw new Error(`Failed to extract text from DOCX file: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  if (mimetype === 'application/pdf' || extension === 'pdf') {
    try {
      // Dynamic import to handle any CJS/ESM quirks cleanly
      const pdfModule = await import('pdf-parse');
      // @ts-expect-error handle both default and module export
      const pdfParser = pdfModule.default || pdfModule;
      
      const pages: ExtractedPage[] = [];
      let currentPage = 1;

      const data = await pdfParser(buffer, {
        pagerender: function (pageData: any) {
          return pageData.getTextContent().then(function (textContent: any) {
            let lastY: number | null = null;
            let text = '';
            for (const item of textContent.items) {
              if (lastY === item.transform[5] || !lastY) {
                text += item.str;
              } else {
                text += '\n' + item.str;
              }
              lastY = item.transform[5];
            }
            pages.push({
              pageNumber: currentPage++,
              text: text.trim(),
            });
            return text;
          });
        },
      });

      const fullText = data.text || '';
      const wordCount = fullText.trim().split(/\s+/).filter(Boolean).length;

      // If page parsing didn't collect individual pages, fallback to chunking full text
      if (pages.length === 0) {
        const fallback = processPlainText(fullText, 'Page');
        return fallback;
      }

      // Extract headings (lines with short uppercase or title style)
      const headings = extractHeadings(fullText);
      const chunks = createChunksFromPages(pages);

      return {
        text: fullText,
        pages,
        chunks,
        pageCount: Math.max(pages.length, data.numpages || 1),
        wordCount,
        headings,
      };
    } catch (err: any) {
      console.warn('Advanced PDF parser error, falling back to basic extraction:', err?.message);
      // Fallback: extract printable strings from raw buffer
      const fallbackText = extractAsciiStrings(buffer);
      if (fallbackText.length > 50) {
        return processPlainText(fallbackText, 'Page');
      }
      throw new Error('Unable to extract text from PDF. The document may be encrypted, scanned image-only, or corrupted.');
    }
  }

  throw new Error(`Unsupported file type: ${mimetype || extension}. Please upload PDF, DOCX, or TXT.`);
}

function createChunksFromPages(pages: ExtractedPage[]): DocumentChunk[] {
  const chunks: DocumentChunk[] = [];
  let chunkIndex = 1;

  for (const page of pages) {
    const words = page.text.split(/\s+/).filter(Boolean);
    if (words.length <= 350) {
      chunks.push({
        chunkId: `chunk-${chunkIndex++}`,
        pageNumber: page.pageNumber,
        text: page.text,
        wordCount: words.length,
      });
    } else {
      for (let i = 0; i < words.length; i += 300) {
        const slice = words.slice(i, i + 320);
        chunks.push({
          chunkId: `chunk-${chunkIndex++}`,
          pageNumber: page.pageNumber,
          text: slice.join(' '),
          wordCount: slice.length,
        });
      }
    }
  }
  return chunks;
}

function processPlainText(rawText: string, chunkPrefix = 'Section'): ExtractionResult {
  const clean = rawText.replace(/\r\n/g, '\n').trim();
  const words = clean.split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  if (wordCount === 0) {
    return {
      text: '',
      pages: [{ pageNumber: 1, text: '' }],
      chunks: [],
      pageCount: 1,
      wordCount: 0,
      headings: [],
    };
  }

  // Break text into logical pages (~400 words per page or by form feeds / double breaks)
  const explicitPages = clean.split(/\f|\n{4,}/);
  const pages: ExtractedPage[] = [];

  if (explicitPages.length > 1) {
    explicitPages.forEach((p, idx) => {
      pages.push({ pageNumber: idx + 1, text: p.trim() });
    });
  } else {
    // Split by approximate 350-word page lengths
    const wordsPerPage = 350;
    const totalPages = Math.ceil(wordCount / wordsPerPage) || 1;
    for (let i = 0; i < totalPages; i++) {
      const pageWords = words.slice(i * wordsPerPage, (i + 1) * wordsPerPage);
      pages.push({
        pageNumber: i + 1,
        text: pageWords.join(' '),
      });
    }
  }

  const headings = extractHeadings(clean);
  const chunks = createChunksFromPages(pages);

  return {
    text: clean,
    pages,
    chunks,
    pageCount: pages.length,
    wordCount,
    headings,
  };
}

function extractHeadings(text: string): string[] {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const headings: string[] = [];
  for (const line of lines) {
    if (
      line.length >= 4 &&
      line.length <= 80 &&
      (/^(\d+(\.\d+)*\s+[A-Z]|Chapter|Section|[A-Z\s]{4,}$)/.test(line) ||
        line.startsWith('#'))
    ) {
      headings.push(line.replace(/^#+\s*/, ''));
      if (headings.length >= 10) break;
    }
  }
  return headings;
}

function extractAsciiStrings(buffer: Buffer): string {
  let str = '';
  for (let i = 0; i < buffer.length; i++) {
    const charCode = buffer[i];
    if (charCode === 10 || charCode === 13 || (charCode >= 32 && charCode <= 126)) {
      str += String.fromCharCode(charCode);
    }
  }
  return str.replace(/\s+/g, ' ');
}
