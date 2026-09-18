"use client";

import { useState, useTransition } from "react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { generateResearchGaps } from "@/lib/actions/analysis";

type Doc = { id: string; title: string };

export function ResearchGapsView({ documents }: { documents: Doc[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [markdown, setMarkdown] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < 6) next.add(id);
      return next;
    });
  };

  const analyze = () => {
    setError(null);
    startTransition(async () => {
      try {
        const res = await generateResearchGaps([...selected]);
        setMarkdown(res.markdown);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
    });
  };

  if (documents.length === 0) {
    return (
      <p className="font-sans text-sm text-ink-faint dark:text-paper/40">
        No papers are ready yet — upload one and wait for it to reach "Ready".
      </p>
    );
  }

  if (markdown) {
    return (
      <div>
        <Button variant="outline" size="sm" onClick={() => setMarkdown(null)}>
          ← Choose different papers
        </Button>
        <div className="mt-6 rounded border border-brass/30 bg-brass/5 px-4 py-3">
          <p className="font-mono text-xs font-medium text-brass">
            AI-generated potential research gaps — for guidance only, not established fact
          </p>
        </div>
        <div className="mt-6 font-sans text-sm leading-relaxed text-ink dark:text-paper/90">
          <ReactMarkdown
            components={{
              p: (props) => <p className="mb-3" {...props} />,
              h1: (props) => <h3 className="mb-2 mt-5 font-display text-base font-medium" {...props} />,
              h2: (props) => <h3 className="mb-2 mt-5 font-display text-base font-medium" {...props} />,
              h3: (props) => <h4 className="mb-2 mt-4 font-display text-sm font-medium" {...props} />,
              strong: (props) => <strong className="font-semibold" {...props} />,
              ul: (props) => <ul className="mb-3 ml-4 list-disc space-y-1" {...props} />,
              li: (props) => <li {...props} />,
            }}
          >
            {markdown}
          </ReactMarkdown>
        </div>
      </div>
    );
  }

  return (
    <div>
      <p className="font-sans text-sm text-ink-soft dark:text-paper/70">
        Select 1–6 papers. Works best with several papers on a related topic.
      </p>
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
      <Button className="mt-4" onClick={analyze} disabled={selected.size === 0 || isPending}>
        {isPending ? "Analyzing…" : `Analyze (${selected.size})`}
      </Button>
    </div>
  );
}
