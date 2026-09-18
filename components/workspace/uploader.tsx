"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { uploadDocument } from "@/lib/actions/document";
import { ACCEPTED_EXTENSIONS, MAX_UPLOAD_BYTES } from "@/lib/validations";
import { cn } from "@/lib/utils";

type FileState = {
  id: string;
  name: string;
  status: "uploading" | "processing" | "done" | "error";
  error?: string;
};

function validateFile(file: File): string | null {
  const ext = "." + file.name.split(".").pop()?.toLowerCase();
  if (!ACCEPTED_EXTENSIONS.includes(ext)) {
    return `${ext || "unknown"} isn't supported — use PDF, TXT, or DOCX`;
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return `File is ${(file.size / 1024 / 1024).toFixed(1)}MB — max is ${MAX_UPLOAD_BYTES / 1024 / 1024}MB`;
  }
  if (file.size === 0) {
    return "File is empty";
  }
  return null;
}

export function Uploader({ workspaceId }: { workspaceId: string }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<FileState[]>([]);

  const handleFiles = useCallback(
    async (fileList: FileList) => {
      const incoming = Array.from(fileList);

      for (const file of incoming) {
        const id = `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        const validationError = validateFile(file);

        if (validationError) {
          setFiles((prev) => [...prev, { id, name: file.name, status: "error", error: validationError }]);
          continue;
        }

        // Goes through our own server (not Vercel Blob's client-upload flow —
        // see the comment in lib/actions/document.ts for why), so there's no
        // byte-level progress event; "uploading" covers transfer, "processing"
        // covers the extract/chunk/embed pipeline that runs before this resolves.
        setFiles((prev) => [...prev, { id, name: file.name, status: "uploading" }]);

        try {
          const formData = new FormData();
          formData.append("workspaceId", workspaceId);
          formData.append("file", file);

          setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, status: "processing" } : f)));

          const result = await uploadDocument(formData);
          if (result.error) throw new Error(result.error);

          setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, status: "done" } : f)));
          router.refresh();
        } catch (err) {
          setFiles((prev) =>
            prev.map((f) =>
              f.id === id
                ? { ...f, status: "error", error: err instanceof Error ? err.message : "Upload failed" }
                : f
            )
          );
        }
      }
    },
    [workspaceId, router]
  );

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
        }}
        className={cn(
          "cursor-pointer rounded border border-dashed border-hairline p-10 text-center transition-colors dark:border-hairline-dark",
          isDragging && "border-brass bg-brass/5"
        )}
      >
        <p className="font-sans text-sm text-ink dark:text-paper">
          Drop a paper here, or <span className="text-teal underline dark:text-teal-muted">browse</span>
        </p>
        <p className="mt-1 font-mono text-xs text-ink-faint dark:text-paper/40">
          PDF, TXT, or DOCX — up to {MAX_UPLOAD_BYTES / 1024 / 1024}MB
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPTED_EXTENSIONS.join(",")}
          className="hidden"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
      </div>

      {files.length > 0 && (
        <ul className="mt-4 space-y-2">
          {files.map((f) => (
            <li key={f.id} className="flex items-center justify-between rounded border border-hairline px-3 py-2 dark:border-hairline-dark">
              <span className="font-sans text-sm text-ink dark:text-paper">{f.name}</span>
              {f.status === "uploading" && (
                <span className="font-mono text-xs text-ink-faint dark:text-paper/40">Uploading…</span>
              )}
              {f.status === "processing" && (
                <span className="font-mono text-xs text-brass">Extracting &amp; indexing…</span>
              )}
              {f.status === "done" && <span className="font-mono text-xs text-teal dark:text-teal-muted">Uploaded</span>}
              {f.status === "error" && <span className="font-mono text-xs text-red-700 dark:text-red-400">{f.error}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
