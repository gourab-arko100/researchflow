"use client";

import { useTransition } from "react";
import { deleteWorkspace } from "@/lib/actions/workspace";

export function DeleteWorkspaceButton({ workspaceId, workspaceName }: { workspaceId: string; workspaceName: string }) {
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    const confirmed = window.confirm(
      `Delete "${workspaceName}"? This permanently removes every paper, chat, and file in it. This can't be undone.`
    );
    if (!confirmed) return;
    startTransition(() => {
      deleteWorkspace(workspaceId);
    });
  };

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className="font-mono text-xs text-red-700 underline decoration-red-700/40 underline-offset-2 hover:decoration-red-700 disabled:opacity-50 dark:text-red-400 dark:decoration-red-400/40 dark:hover:decoration-red-400"
    >
      {isPending ? "Deleting…" : "Delete workspace"}
    </button>
  );
}
