"use server";

import { revalidatePath } from "next/cache";
import { del, put } from "@vercel/blob";
import { getOrCreateCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { processDocument } from "@/lib/processing/pipeline";
import { ACCEPTED_DOCUMENT_TYPES, ACCEPTED_EXTENSIONS, MAX_UPLOAD_BYTES } from "@/lib/validations";

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
  if (!(file instanceof File)) return { error: "No file provided" };

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

  const blob = await put(file.name, file, { access: "public", addRandomSuffix: true });

  const document = await db.document.create({
    data: {
      workspaceId: workspace.id,
      title: file.name.replace(/\.(pdf|txt|docx)$/i, ""),
      authors: [],
      keywords: [],
      fileUrl: blob.url,
      fileName: file.name,
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

  const document = await db.document.findFirst({
    where: { id: documentId, workspace: { ownerId: user.id } },
  });
  if (!document) throw new Error("Document not found");

  await processDocument(documentId);
  revalidatePath(`/workspace/${document.workspaceId}`);
}

export async function deleteDocument(documentId: string) {
  const user = await getOrCreateCurrentUser();
  if (!user) throw new Error("Not signed in");

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
