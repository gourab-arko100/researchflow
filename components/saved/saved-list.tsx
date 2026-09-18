"use client";

import { useState, useTransition } from "react";
import { deleteSavedInsight } from "@/lib/actions/saved";

type Insight = { id: string; kind: string; content: string; sourceRef: string | null; createdAt: string };

const KIND_LABELS: Record<string, string> = {
  ai_response: "AI answer",
  research_gap: "Research gap",
  citation: "Citation",
  section: "Section",
};

export function SavedList({ initialInsights }: { initialInsights: Insight[] }) {
  const [insights, setInsights] = useState(initialInsights);
  const [, startTransition] = useTransition();

  const remove = (id: string) => {
    setInsights((prev) => prev.filter((i) => i.id !== id));
    startTransition(async () => {
      await deleteSavedInsight(id);
    });
  };

  if (insights.length === 0) {
    return (
      <p className="font-sans text-sm text-ink-faint dark:text-paper/40">
        Nothing saved yet — look for "Save this answer" on any AI response.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-hairline border-t border-hairline dark:divide-hairline-dark dark:border-hairline-dark">
      {insights.map((i) => (
        <li key={i.id} className="py-4">
          <div className="flex items-start justify-between gap-4">
            <span className="rounded-sm border border-hairline px-1.5 py-0.5 font-mono text-[10px] text-ink-faint dark:border-hairline-dark dark:text-paper/40">
              {KIND_LABELS[i.kind] ?? i.kind}
            </span>
            <button
              onClick={() => remove(i.id)}
              className="shrink-0 font-mono text-xs text-red-700/70 hover:text-red-700 dark:text-red-400/70 dark:hover:text-red-400"
            >
              Delete
            </button>
          </div>
          <p className="mt-2 whitespace-pre-wrap font-sans text-sm leading-relaxed text-ink dark:text-paper/90">
            {i.content}
          </p>
        </li>
      ))}
    </ul>
  );
}
