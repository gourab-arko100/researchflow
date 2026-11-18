import { z } from "zod";

export const ACCEPTED_DOCUMENT_TYPES = [
  "application/pdf",
  "text/plain",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
] as const;

export const ACCEPTED_EXTENSIONS = [".pdf", ".txt", ".docx"];

// Vercel Functions (which Server Actions run as) have a hard, unconfigurable
// 4.5MB request body limit at the platform level — Next.js's own
// serverActions.bodySizeLimit in next.config.mjs does NOT override it. Since
// uploads go through a server action (see lib/actions/document.ts — moved
// there in Phase 3 specifically to route around a Vercel Blob client-upload
// CORS bug), the cap here has to stay comfortably under 4.5MB or production
// uploads on Vercel will fail with FUNCTION_PAYLOAD_TOO_LARGE for any file
// this limit doesn't already catch client-side. 4MB leaves headroom for
// multipart/FormData encoding overhead on top of the raw file bytes.
//
// This trades max file size for upload reliability on Vercel. If you need
// larger files, the documented alternative (and Vercel's own recommended
// pattern) is switching back to @vercel/blob/client's direct browser-to-Blob
// upload, bypassing the server entirely — see the git history around Phase 3
// for the version of components/workspace/uploader.tsx and
// app/api/upload/route.ts that implemented it, before the CORS bug forced a
// move to server-side upload. That bug may or may not still be present; it
// wasn't retested before this cap was chosen.
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024; // 4MB — see note above

export const workspaceNameSchema = z
  .string()
  .trim()
  .min(1, "Name is required")
  .max(80, "Keep it under 80 characters");

export const createWorkspaceSchema = z.object({
  name: workspaceNameSchema,
  description: z.string().trim().max(280).optional(),
});

// ---------------------------------------------------------------------------
// Server-side input guards. Server actions can be called directly with any
// arguments (TypeScript types are not enforced at runtime), so every action
// re-checks what it receives.
// ---------------------------------------------------------------------------

/** Validates an id coming from the client (cuid / uuid style). */
export function assertId(value: unknown, label = "id"): string {
  if (typeof value !== "string" || value.length === 0 || value.length > 64 || !/^[A-Za-z0-9_-]+$/.test(value)) {
    throw new Error(`Invalid ${label}`);
  }
  return value;
}

/** Validates and de-duplicates a list of ids, capped at `max`. */
export function assertIdList(value: unknown, max: number, label = "selection"): string[] {
  if (!Array.isArray(value)) throw new Error(`Invalid ${label}`);
  if (value.length > max) throw new Error(`Too many items in ${label} (max ${max})`);
  return [...new Set(value.map((v) => assertId(v, label)))];
}

/** Trims and length-checks free text. */
export function assertText(value: unknown, max: number, label = "text", { allowEmpty = false } = {}): string {
  if (typeof value !== "string") throw new Error(`Invalid ${label}`);
  const trimmed = value.trim();
  if (!allowEmpty && !trimmed) throw new Error(`${label[0]!.toUpperCase()}${label.slice(1)} is empty`);
  if (trimmed.length > max) throw new Error(`Keep ${label} under ${max} characters`);
  return trimmed;
}

export const MAX_TAGS = 10;
export const MAX_TAG_LENGTH = 32;

export function assertTags(value: unknown): string[] {
  if (value == null) return [];
  if (!Array.isArray(value)) throw new Error("Invalid tags");
  if (value.length > MAX_TAGS) throw new Error(`At most ${MAX_TAGS} tags`);
  return value.map((t) => assertText(t, MAX_TAG_LENGTH, "tag")).filter(Boolean);
}

export function assertPageNumber(value: unknown): number | null {
  if (value == null) return null;
  if (typeof value !== "number" || !Number.isInteger(value) || value < 1 || value > 100000) {
    throw new Error("Invalid page number");
  }
  return value;
}

// Per-user quotas — stop one account from filling storage or running up AI cost.
export const MAX_WORKSPACES_PER_USER = 50;
export const MAX_DOCUMENTS_PER_USER = 300;

/** Checks a file's first bytes really match its extension, so a renamed
 * executable or HTML file can't be stored as a "PDF". */
export function sniffFileKind(bytes: Uint8Array, ext: string): boolean {
  const startsWith = (sig: number[], offset = 0) => sig.every((b, i) => bytes[offset + i] === b);
  switch (ext) {
    case ".pdf": {
      // "%PDF-" must appear within the first 1KB (the spec allows leading junk).
      const head = Buffer.from(bytes.subarray(0, 1024)).toString("latin1");
      return head.includes("%PDF-");
    }
    case ".docx":
      return startsWith([0x50, 0x4b, 0x03, 0x04]); // ZIP container "PK\x03\x04"
    case ".txt": {
      // Plain text: no NUL bytes in the first 8KB.
      const sample = bytes.subarray(0, 8192);
      for (const b of sample) if (b === 0) return false;
      return true;
    }
    default:
      return false;
  }
}

export const CONTENT_TYPE_FOR_EXT: Record<string, string> = {
  ".pdf": "application/pdf",
  ".txt": "text/plain; charset=utf-8",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

/** Safe storage name: strips paths and odd characters from the uploaded name. */
export function safeStorageName(fileName: string, ext: string): string {
  const base = fileName
    .replace(/\.[^.]*$/, "")
    .replace(/[^A-Za-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return `documents/${base || "document"}${ext}`;
}
