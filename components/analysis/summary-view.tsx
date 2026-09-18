"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { generateSummary } from "@/lib/actions/analysis";
import type { StructuredSummary, SummaryMode } from "@/lib/ai/analysis/types";

type Cached = {
  mode: SummaryMode | null;
  text: string | null;
  structured: StructuredSummary | null;
};

const MODES: { value: SummaryMode; label: string }[] = [
  { value: "brief", label: "Brief" },
  { value: "detailed", label: "Detailed" },
  { value: "structured", label: "Structured" },
];

const STRUCTURED_FIELDS: { key: keyof StructuredSummary; label: string }[] = [
  { key: "overview", label: "Overview" },
  { key: "researchProblem", label: "Research Problem" },
  { key: "methodology", label: "Methodology" },
  { key: "dataset", label: "Dataset" },
  { key: "results", label: "Results" },
  { key: "limitations", label: "Limitations" },
  { key: "futureWork", label: "Future Work" },
];

export function SummaryView({ documentId, cached }: { documentId: string; cached: Cached }) {
  const [mode, setMode] = useState<SummaryMode>(cached.mode ?? "structured");
  const [text, setText] = useState<string | null>(cached.mode && cached.mode !== "structured" ? cached.text : null);
  const [structured, setStructured] = useState<StructuredSummary | null>(
    cached.mode === "structured" ? cached.structured : null
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const generate = () => {
    setError(null);
    startTransition(async () => {
      try {
        const result = await generateSummary(documentId, mode);
        if (result.structured) {
          setStructured(result.structured);
          setText(null);
        } else {
          setText(result.text ?? null);
          setStructured(null);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
    });
  };

  const hasResult = mode === "structured" ? !!structured : !!text;

  return (
    <div className="mt-8">
      <div className="flex flex-wrap items-center gap-2">
        {MODES.map((m) => (
          <button
            key={m.value}
            onClick={() => setMode(m.value)}
            className={`rounded-sm border px-3 py-1.5 font-mono text-xs transition-colors ${
              mode === m.value
                ? "border-ink bg-ink text-paper dark:border-paper dark:bg-paper dark:text-ink"
                : "border-hairline text-ink-soft hover:border-ink dark:border-hairline-dark dark:text-paper/60 dark:hover:border-paper"
            }`}
          >
            {m.label}
          </button>
        ))}
        <Button size="sm" variant="brass" onClick={generate} disabled={isPending} className="ml-2">
          {isPending ? "Generating…" : hasResult ? "Regenerate" : "Generate summary"}
        </Button>
      </div>

      {error && <p className="mt-3 font-sans text-xs text-red-700 dark:text-red-400">{error}</p>}

      {mode === "structured" && structured && (
        <div className="mt-6 space-y-6">
          {STRUCTURED_FIELDS.map((f) => (
            <div key={f.key}>
              <h3 className="font-display text-base">{f.label}</h3>
              <p className="mt-1.5 max-w-prose font-sans text-sm leading-relaxed text-ink-soft dark:text-paper/70">
                {structured[f.key] || "—"}
              </p>
            </div>
          ))}
        </div>
      )}

      {mode !== "structured" && text && (
        <p className="mt-6 max-w-prose whitespace-pre-wrap font-sans text-sm leading-relaxed text-ink-soft dark:text-paper/70">
          {text}
        </p>
      )}

      {!hasResult && !isPending && (
        <p className="mt-6 font-sans text-sm text-ink-faint dark:text-paper/40">
          No summary generated yet in this mode — click Generate above.
        </p>
      )}
    </div>
  );
}
