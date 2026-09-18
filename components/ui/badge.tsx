import { cn } from "@/lib/utils";

const statusStyles: Record<string, string> = {
  UPLOADING: "text-ink-faint border-hairline dark:text-paper/40 dark:border-hairline-dark",
  EXTRACTING: "text-brass border-brass/30 bg-brass/5",
  PROCESSING: "text-brass border-brass/30 bg-brass/5",
  INDEXING: "text-brass border-brass/30 bg-brass/5",
  READY: "text-teal border-teal/30 bg-teal/5 dark:text-teal-muted",
  FAILED: "text-red-700 border-red-700/30 bg-red-700/5 dark:text-red-400",
};

const statusLabels: Record<string, string> = {
  UPLOADING: "Uploading",
  EXTRACTING: "Extracting",
  PROCESSING: "Processing",
  INDEXING: "Indexing",
  READY: "Ready",
  FAILED: "Failed",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm border px-2 py-0.5 font-mono text-[11px]",
        statusStyles[status] ?? statusStyles.PROCESSING
      )}
    >
      {statusLabels[status] ?? status}
    </span>
  );
}
