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
