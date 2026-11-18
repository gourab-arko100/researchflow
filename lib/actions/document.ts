"use server";

import { revalidatePath } from "next/cache";
import { del, put } from "@vercel/blob";
import { getOrCreateCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { processDocument } from "@/lib/processing/pipeline";
import { assertRateLimit } from "@/lib/rate-limit";
import {
  ACCEPTED_DOCUMENT_TYPES,
  ACCEPTED_EXTENSIONS,
  CONTENT_TYPE_FOR_EXT,
  MAX_DOCUMENTS_PER_USER,
  MAX_UPLOAD_BYTES,
  assertId,
  safeStorageName,
  sniffFileKind,
} from "@/lib/validations";

/**
 * Uploads go through our own server (not Vercel Blob's client-upload
 * `upload()` flow) — that flow currently has a platform-side bug where its
 * `vercel.com/api/blob` endpoint fails its own CORS check for many users
 * (confirmed by other developers hitting the identical error, unrelated to
 * network/extensions/tokens). A plain server-side `put()` sidesteps it
 * entirely. Caps at MAX_UPLOAD_BYTES (4MB — see the note in lib/validations.ts
 * for why it's not the 25MB this originally shipped with).
 */
export async function uploadDocument(formData: FormData): Promise<{ id?: string; error?: string }> {
  const user = await getOrCreateCurrentUser();
  if (!user) return { error: "Not signed in" };

  const workspaceId = formData.get("workspaceId");
  const file = formData.get("file");

  if (typeof workspaceId !== "string" || !workspaceId) return { error: "Missing workspace" };
  try {
    assertId(workspaceId, "workspace");
  } catch {
    return { error: "Invalid workspace" };
  }
  if (!(file instanceof File)) return { error: "No file provided" };

  try {
    await assertRateLimit(`upload:${user.id}`, 20, 60 * 60 * 1000); // 20 uploads / hour
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Too many uploads" };
  }

  const ext = "." + file.name.split(".").pop()?.toLowerCase();
  if (!ACCEPTED_EXTENSIONS.includes(ext)) {
    return { error: `${ext || "unknown"} isn't supported — use PDF, TXT, or DOCX` };
  }
  if (file.size === 0) return { error: "File is empty" };
  if (file.size > MAX_UPLOAD_BYTES) {
    return { error: `File is ${(file.size / 1024 / 1024).toFixed(1)}MB — max is ${MAX_UPLOAD_BYTES / 1024 / 1024}MB` };
  }
  if (file.type && !ACCEPTED_DOCUMENT_TYPES.includes(file.type as (typeof ACCEPTED_DOCUMENT_TYPES)[number])) {
    // Some browsers leave `type` empty for certain files — only reject when it's set and wrong.
    return { error: `Unsupported file type: ${file.type}` };
  }

  const workspace = await db.workspace.findFirst({
    where: { id: workspaceId, ownerId: user.id },
    select: { id: true },
  });
  if (!workspace) return { error: "Workspace not found" };

  const documentCount = await db.document.count({ where: { workspace: { ownerId: user.id } } });
  if (documentCount >= MAX_DOCUMENTS_PER_USER) {
    return { error: `You've reached the limit of ${MAX_DOCUMENTS_PER_USER} papers — delete some to upload more` };
  }

  // Check the real file contents, not just the name the browser sent.
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!sniffFileKind(bytes, ext)) {
    return { error: `This file doesn't look like a real ${ext.slice(1).toUpperCase()} file` };
  }

  // Stored under a sanitized name with a random suffix and an explicit,
  // safe content type — never the name/type the browser claimed.
  const blob = await put(safeStorageName(file.name, ext), Buffer.from(bytes), {
    access: "public",
    addRandomSuffix: true,
    contentType: CONTENT_TYPE_FOR_EXT[ext],
  });

  const displayName = file.name.slice(0, 200);

  const document = await db.document.create({
    data: {
      workspaceId: workspace.id,
      title: displayName.replace(/\.(pdf|txt|docx)$/i, ""),
      authors: [],
      keywords: [],
      fileUrl: blob.url,
      fileName: displayName,
      fileSizeBytes: file.size,
      status: "PROCESSING",
    },
  });

  // Extract text synchronously — see lib/processing/pipeline.ts for why.
  // Failures land the document at FAILED with processingError set, rather
  // than throwing here (the upload itself succeeded; only extraction didn't).
  await processDocument(document.id);

  revalidatePath(`/workspace/${workspace.id}`);
  return { id: document.id };
}

export async function retryProcessing(documentId: string) {
  const user = await getOrCreateCurrentUser();
  if (!user) throw new Error("Not signed in");
  assertId(documentId, "document");

  const document = await db.document.findFirst({
    where: { id: documentId, workspace: { ownerId: user.id } },
  });
  if (!document) throw new Error("Document not found");
  if (document.status === "READY") return; // nothing to retry — avoid paying for re-indexing

  // Re-processing re-runs embeddings (real API cost), so it shares the upload budget.
  await assertRateLimit(`upload:${user.id}`, 20, 60 * 60 * 1000);

  await processDocument(documentId);
  revalidatePath(`/workspace/${document.workspaceId}`);
}

export async function deleteDocument(documentId: string) {
  const user = await getOrCreateCurrentUser();
  if (!user) throw new Error("Not signed in");
  assertId(documentId, "document");

  const document = await db.document.findFirst({
    where: { id: documentId, workspace: { ownerId: user.id } },
  });
  if (!document) throw new Error("Document not found");

  await db.document.delete({ where: { id: documentId } });
  await del(document.fileUrl).catch(() => {
    // blob already gone — fine
  });

  revalidatePath(`/workspace/${document.workspaceId}`);
}
