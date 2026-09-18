"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { getOrGenerateSummary } from "@/lib/actions/analysis";
import type { StructuredSummary } from "@/lib/ai/types";

const SECTION_ORDER: { key: keyof StructuredSummary; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "researchProblem", label: "Research Problem" },
  { key: "methodology", label: "Methodology" },
  { key: "dataset", label: "Dataset" },
  { key: "results", label: "Results" },
  { key: "limitations", label: "Limitations" },
  { key: "futureWork", label: "Future Work" },
];

export function SummaryPanel({
  documentId,
  initialSummary,
}: {
  documentId: string;
  initialSummary: StructuredSummary | null;
}) {
  const [summary, setSummary] = useState<StructuredSummary | null>(initialSummary);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const generate = (force: boolean) => {
    setError(null);
    startTransition(async () => {
      try {
        const result = await getOrGenerateSummary(documentId, force);
        setSummary(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
    });
  };

  if (!summary) {
    return (
      <div>
        <Button onClick={() => generate(false)} disabled={isPending}>
          {isPending ? "Generating…" : "Generate summary"}
        </Button>
        {error && <p className="mt-3 font-sans text-sm text-red-700 dark:text-red-400">{error}</p>}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="font-mono text-xs text-ink-faint dark:text-paper/40">
          Structured summary — cached after first generation
        </p>
        <Button size="sm" variant="ghost" onClick={() => generate(true)} disabled={isPending}>
          {isPending ? "Regenerating…" : "Regenerate"}
        </Button>
      </div>
      {error && <p className="mt-3 font-sans text-sm text-red-700 dark:text-red-400">{error}</p>}
      <dl className="mt-4 space-y-5">
        {SECTION_ORDER.map(({ key, label }) => {
          const value = summary[key];
          if (!value) return null;
          return (
            <div key={key}>
              <dt className="font-mono text-xs text-brass">{label}</dt>
              <dd className="mt-1 font-sans text-sm leading-relaxed text-ink dark:text-paper/90">{value}</dd>
            </div>
          );
        })}
      </dl>
    </div>
  );
}
