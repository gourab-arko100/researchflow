"use client";

import { useState, useTransition } from "react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { compareDocuments } from "@/lib/actions/analysis";
import type { StructuredSummary } from "@/lib/ai/types";

type Doc = { id: string; title: string };
type Paper = { documentId: string; title: string; summary: StructuredSummary };

const ROWS: { key: keyof StructuredSummary; label: string }[] = [
  { key: "researchProblem", label: "Research Problem" },
  { key: "methodology", label: "Methodology" },
  { key: "dataset", label: "Dataset" },
  { key: "results", label: "Results" },
  { key: "limitations", label: "Limitations" },
];

export function ComparisonView({ documents }: { documents: Doc[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [result, setResult] = useState<{ papers: Paper[]; narrative: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < 5) next.add(id);
      return next;
    });
  };

  const compare = () => {
    setError(null);
    startTransition(async () => {
      try {
        const res = await compareDocuments([...selected]);
        setResult(res);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
    });
  };

  if (documents.length < 2) {
    return (
      <p className="font-sans text-sm text-ink-faint dark:text-paper/40">
        You need at least 2 papers marked "Ready" in this workspace to compare.
      </p>
    );
  }

  return (
    <div>
      {!result && (
        <>
          <p className="font-sans text-sm text-ink-soft dark:text-paper/70">Select 2–5 papers.</p>
          <ul className="mt-3 space-y-2">
            {documents.map((doc) => (
              <li key={doc.id}>
                <label className="flex cursor-pointer items-center gap-3 rounded border border-hairline px-3 py-2.5 hover:border-ink dark:border-hairline-dark dark:hover:border-paper">
                  <input
                    type="checkbox"
                    checked={selected.has(doc.id)}
                    onChange={() => toggle(doc.id)}
                    className="h-4 w-4 accent-brass"
                  />
                  <span className="font-sans text-sm text-ink dark:text-paper">{doc.title}</span>
                </label>
              </li>
            ))}
          </ul>
          {error && <p className="mt-2 font-sans text-xs text-red-700 dark:text-red-400">{error}</p>}
          <Button className="mt-4" onClick={compare} disabled={selected.size < 2 || isPending}>
            {isPending ? "Comparing…" : `Compare (${selected.size})`}
          </Button>
        </>
      )}

      {result && (
        <div>
          <Button variant="outline" size="sm" onClick={() => setResult(null)}>
            ← Choose different papers
          </Button>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr>
                  <th className="border-b border-hairline pb-2 pr-4 font-mono text-xs text-ink-faint dark:border-hairline-dark dark:text-paper/40">
                    &nbsp;
                  </th>
                  {result.papers.map((p) => (
                    <th
                      key={p.documentId}
                      className="border-b border-hairline pb-2 pr-4 font-display text-sm font-medium dark:border-hairline-dark"
                    >
                      {p.title}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ROWS.map((row) => (
                  <tr key={row.key}>
                    <td className="border-b border-hairline py-3 pr-4 align-top font-mono text-xs text-brass dark:border-hairline-dark">
                      {row.label}
                    </td>
                    {result.papers.map((p) => (
                      <td
                        key={p.documentId}
                        className="border-b border-hairline py-3 pr-4 align-top font-sans text-sm text-ink dark:border-hairline-dark dark:text-paper/90"
                      >
                        {p.summary[row.key] || <span className="text-ink-faint dark:text-paper/30">not stated</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-8">
            <h2 className="font-display text-lg">Comparative analysis</h2>
            <div className="mt-3 font-sans text-sm leading-relaxed text-ink dark:text-paper/90">
              <ReactMarkdown
                components={{
                  p: (props) => <p className="mb-3" {...props} />,
                  h1: (props) => <h3 className="mb-2 mt-4 font-display text-base font-medium" {...props} />,
                  h2: (props) => <h3 className="mb-2 mt-4 font-display text-base font-medium" {...props} />,
                  h3: (props) => <h4 className="mb-2 mt-3 font-display text-sm font-medium" {...props} />,
                  strong: (props) => <strong className="font-semibold" {...props} />,
                  ul: (props) => <ul className="mb-3 ml-4 list-disc space-y-1" {...props} />,
                  li: (props) => <li {...props} />,
                }}
              >
                {result.narrative}
              </ReactMarkdown>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
