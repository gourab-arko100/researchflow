import Link from "next/link";
import { StatusBadge } from "@/components/ui/badge";
import { deleteDocument, retryProcessing } from "@/lib/actions/document";
import type { Document } from "@prisma/client";

export function DocumentList({ documents }: { documents: Document[] }) {
  if (documents.length === 0) {
    return (
      <p className="mt-8 font-sans text-sm text-ink-faint dark:text-paper/40">
        No papers yet — upload one above to get started.
      </p>
    );
  }

  return (
    <ul className="mt-8 divide-y divide-hairline border-t border-hairline dark:divide-hairline-dark dark:border-hairline-dark">
      {documents.map((doc) => {
        const isReadable = doc.status !== "UPLOADING" && doc.status !== "EXTRACTING";
        const canRetry = doc.status !== "READY" && doc.status !== "UPLOADING";
        return (
          <li key={doc.id} className="py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                {isReadable ? (
                  <Link href={`/document/${doc.id}`} className="truncate font-display text-base hover:text-brass dark:hover:text-brass-muted">
                    {doc.title}
                  </Link>
                ) : (
                  <p className="truncate font-display text-base text-ink-faint dark:text-paper/40">{doc.title}</p>
                )}
                <p className="mt-0.5 font-mono text-xs text-ink-faint dark:text-paper/40">
                  {doc.fileName} · {(doc.fileSizeBytes / 1024 / 1024).toFixed(1)}MB
                  {doc.pageCount ? ` · ${doc.pageCount} pages` : ""}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <StatusBadge status={doc.status} />
                {canRetry && (
                  <form
                    action={async () => {
                      "use server";
                      await retryProcessing(doc.id);
                    }}
                  >
                    <button type="submit" className="font-sans text-xs text-teal hover:underline dark:text-teal-muted">
                      Retry
                    </button>
                  </form>
                )}
                <form
                  action={async () => {
                    "use server";
                    await deleteDocument(doc.id);
                  }}
                >
                  <button
                    type="submit"
                    className="font-sans text-xs text-red-700/70 underline decoration-red-700/30 underline-offset-2 hover:text-red-700 hover:decoration-red-700 dark:text-red-400/70 dark:decoration-red-400/30 dark:hover:text-red-400 dark:hover:decoration-red-400"
                  >
                    Remove
                  </button>
                </form>
              </div>
            </div>
            {doc.status === "FAILED" && doc.processingError && (
              <p className="mt-2 font-mono text-xs text-red-700 dark:text-red-400">{doc.processingError}</p>
            )}
          </li>
        );
      })}
    </ul>
  );
}
