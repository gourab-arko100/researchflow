// Import the internal module directly, not the package root — pdf-parse's
// index.js has a debug-mode check that misfires under webpack/Next.js
// bundling and throws an unrelated ENOENT on a sample test file.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const pdfParse = require("pdf-parse/lib/pdf-parse.js") as typeof import("pdf-parse");
import mammoth from "mammoth";

const PSEUDO_PAGE_CHARS = 3000; // for formats with no native page concept

/**
 * True per-page extraction for PDFs, using pdf-parse's pagerender hook —
 * each page's text is captured as pdf.js renders it, rather than splitting
 * the whole-document text blob after the fact.
 */
export async function extractPdfPages(buffer: Buffer): Promise<string[]> {
  const pages: string[] = [];

  await pdfParse(
    buffer,
    {
      pagerender: async (pageData: { getTextContent: () => Promise<{ items: { str?: string }[] }> }) => {
        const textContent = await pageData.getTextContent();
        const text = textContent.items.map((item) => item.str ?? "").join(" ");
        pages.push(text.trim());
        return text;
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any
  );

  return pages;
}

/** DOCX has no fixed pagination — mammoth gives us plain text, which we split
 * into fixed-size pseudo-pages so downstream chunking/citation still has a
 * page number to point at. Approximate, not a real page boundary. */
export async function extractDocxPages(buffer: Buffer): Promise<string[]> {
  const { value: text } = await mammoth.extractRawText({ buffer });
  return chunkIntoPseudoPages(text);
}

/** Plain text — same pseudo-pagination as DOCX. */
export function extractTxtPages(buffer: Buffer): string[] {
  return chunkIntoPseudoPages(buffer.toString("utf-8"));
}

function chunkIntoPseudoPages(text: string, size = PSEUDO_PAGE_CHARS): string[] {
  const normalized = text.trim();
  if (!normalized) return [];

  const pages: string[] = [];
  for (let i = 0; i < normalized.length; i += size) {
    pages.push(normalized.slice(i, i + size).trim());
  }
  return pages.filter(Boolean);
}

export function extractionKind(fileName: string): "pdf" | "docx" | "txt" | null {
  const ext = fileName.split(".").pop()?.toLowerCase();
  if (ext === "pdf") return "pdf";
  if (ext === "docx") return "docx";
  if (ext === "txt") return "txt";
  return null;
}
