"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { createConversation } from "@/lib/actions/chat";

type Doc = { id: string; title: string; pageCount: number | null };

export function PaperSelector({ workspaceId, documents }: { workspaceId: string; documents: Doc[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const start = () => {
    setError(null);
    startTransition(async () => {
      const result = await createConversation(workspaceId, [...selected]);
      if (result?.error) setError(result.error);
    });
  };

  if (documents.length === 0) {
    return (
      <p className="font-sans text-sm text-ink-faint dark:text-paper/40">
        No papers are indexed yet — upload one and wait for it to reach "Ready" before starting a chat.
      </p>
    );
  }

  return (
    <div>
      <ul className="space-y-2">
        {documents.map((doc) => (
          <li key={doc.id}>
            <label className="flex cursor-pointer items-center gap-3 rounded border border-hairline px-3 py-2.5 hover:border-ink dark:border-hairline-dark dark:hover:border-paper">
              <input
                type="checkbox"
                checked={selected.has(doc.id)}
                onChange={() => toggle(doc.id)}
                className="h-4 w-4 accent-brass"
              />
              <span className="flex-1 font-sans text-sm text-ink dark:text-paper">{doc.title}</span>
              {doc.pageCount && (
                <span className="font-mono text-xs text-ink-faint dark:text-paper/40">{doc.pageCount}p</span>
              )}
            </label>
          </li>
        ))}
      </ul>
      {error && <p className="mt-2 font-sans text-xs text-red-700 dark:text-red-400">{error}</p>}
      <Button className="mt-4" onClick={start} disabled={selected.size === 0 || isPending}>
        {isPending ? "Starting…" : `Start chat${selected.size > 0 ? ` (${selected.size})` : ""}`}
      </Button>
    </div>
  );
}
