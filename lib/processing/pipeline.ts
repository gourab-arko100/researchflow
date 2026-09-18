import { db } from "@/lib/db";
import { extractDocxPages, extractionKind, extractPdfPages, extractTxtPages } from "@/lib/processing/extract";
import { chunkPages } from "@/lib/ai/chunk";
import { deleteChunksForDocument, insertChunkEmbeddings } from "@/lib/ai/vector";
import { getEmbeddingService } from "@/lib/ai";

/**
 * Runs synchronously as part of the upload request (see
 * lib/actions/document.ts) rather than on a queue — deliberately, to avoid
 * adding infrastructure (a job runner, a cron route) a portfolio-scale app
 * doesn't need. Fine for typical paper-sized PDFs; a very large upload will
 * just make the "Uploaded" toast take a few seconds longer.
 *
 * Full pipeline: PROCESSING -> EXTRACTING -> INDEXING -> READY, or FAILED
 * with a real error at whichever step broke.
 */
export async function processDocument(documentId: string): Promise<void> {
  const document = await db.document.findUnique({ where: { id: documentId } });
  if (!document) return;

  try {
    await db.document.update({
      where: { id: documentId },
      data: { status: "EXTRACTING", processingError: null },
    });

    const kind = extractionKind(document.fileName);
    if (!kind) throw new Error(`Unsupported file type: ${document.fileName}`);

    const response = await fetch(document.fileUrl);
    if (!response.ok) throw new Error(`Could not fetch uploaded file (${response.status})`);
    const buffer = Buffer.from(await response.arrayBuffer());

    let pages: string[];
    switch (kind) {
      case "pdf":
        pages = await extractPdfPages(buffer);
        break;
      case "docx":
        pages = await extractDocxPages(buffer);
        break;
      case "txt":
        pages = extractTxtPages(buffer);
        break;
    }

    if (pages.length === 0) {
      throw new Error("No extractable text found — the file may be a scanned image without OCR");
    }

    // Replace any pages/chunks from a previous attempt (retry path)
    await db.documentPage.deleteMany({ where: { documentId } });
    await deleteChunksForDocument(documentId);

    await db.documentPage.createMany({
      data: pages.map((text, i) => ({ documentId, pageNumber: i + 1, text })),
    });

    await db.document.update({
      where: { id: documentId },
      data: { pageCount: pages.length, status: "INDEXING", processingError: null },
    });

    // --- Indexing: chunk -> embed -> store in pgvector ---
    const chunks = chunkPages(pages.map((text, i) => ({ pageNumber: i + 1, text })));
    if (chunks.length === 0) throw new Error("Extracted text produced no chunks");

    const embeddingService = getEmbeddingService();
    const embeddings = await embeddingService.embedBatch(chunks.map((c) => c.text));

    await insertChunkEmbeddings(
      documentId,
      chunks.map((c, i) => ({ pageNumber: c.pageNumber, text: c.text, embedding: embeddings[i] }))
    );

    await db.document.update({
      where: { id: documentId },
      data: { status: "READY", processingError: null },
    });
  } catch (error) {
    await db.document.update({
      where: { id: documentId },
      data: {
        status: "FAILED",
        processingError: error instanceof Error ? error.message : "Processing failed",
      },
    });
  }
}
