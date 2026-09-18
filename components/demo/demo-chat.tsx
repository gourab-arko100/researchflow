"use client";

import { useState, useTransition } from "react";
import ReactMarkdown from "react-markdown";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { askDemoQuestion } from "@/lib/actions/demo";
import type { Citation } from "@/lib/ai/types";

type Turn = { question: string; answer: string; citations: Citation[] };

export function DemoChat({ documentIds }: { documentIds: string[] }) {
  const [question, setQuestion] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const ask = () => {
    const q = question.trim();
    if (!q) return;
    setError(null);
    setQuestion("");
    startTransition(async () => {
      try {
        const res = await askDemoQuestion(documentIds, q);
        setTurns((prev) => [...prev, { question: q, answer: res.answer, citations: res.citations }]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
    });
  };

  return (
    <div className="rounded border border-hairline bg-paper-raised p-5 dark:border-hairline-dark dark:bg-paper-dark-raised">
      <p className="font-mono text-xs text-ink-faint dark:text-paper/40">
        Ask across all {documentIds.length} demo papers — real retrieval, extractive answers (no API key active here)
      </p>

      {turns.length > 0 && (
        <div className="mt-4 space-y-4">
          {turns.map((t, i) => (
            <div key={i}>
              <p className="font-sans text-sm font-medium text-ink dark:text-paper">{t.question}</p>
              <div className="mt-1 font-sans text-sm leading-relaxed text-ink-soft dark:text-paper/70">
                <ReactMarkdown components={{ p: (props) => <p className="mb-1 last:mb-0" {...props} /> }}>
                  {t.answer}
                </ReactMarkdown>
              </div>
              {t.citations.length > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {t.citations.map((c) => (
                    <span
                      key={`${c.documentId}-${c.pageNumber}`}
                      className="rounded-sm border border-teal/30 bg-teal/5 px-1.5 py-0.5 font-mono text-[11px] text-teal dark:text-teal-muted"
                    >
                      {c.documentTitle.length > 28 ? c.documentTitle.slice(0, 28) + "…" : c.documentTitle}, p.{c.pageNumber}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {error && <p className="mt-2 font-sans text-xs text-red-700 dark:text-red-400">{error}</p>}

      <div className="mt-4 flex gap-2">
        <Input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && ask()}
          placeholder="Which papers use transformer-based architectures?"
        />
        <Button onClick={ask} disabled={isPending || !question.trim()}>
          {isPending ? "…" : "Ask"}
        </Button>
      </div>
    </div>
  );
}
