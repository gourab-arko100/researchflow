"use client";

import { useState, useTransition } from "react";
import ReactMarkdown from "react-markdown";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { askDemoQuestion } from "@/lib/actions/demo";
import type { Citation } from "@/lib/ai/types";

type Page = { pageNumber: number; text: string };
type Doc = { id: string; title: string; authors: string[]; year: number | null; abstract: string | null };

export function DemoDocumentView({ document, pages }: { document: Doc; pages: Page[] }) {
  const [currentPage, setCurrentPage] = useState(pages[0]?.pageNumber ?? 1);
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState<{ answer: string; citations: Citation[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const active = pages.find((p) => p.pageNumber === currentPage) ?? pages[0];

  const ask = () => {
    if (!question.trim()) return;
    setError(null);
    startTransition(async () => {
      try {
        const res = await askDemoQuestion([document.id], question);
        setResult(res);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
    });
  };

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-[160px_1fr_280px]">
      <aside>
        <p className="font-mono text-xs text-ink-faint dark:text-paper/40">Pages ({pages.length})</p>
        <ul className="mt-3 space-y-0.5">
          {pages.map((p) => (
            <li key={p.pageNumber}>
              <button
                onClick={() => setCurrentPage(p.pageNumber)}
                className={`w-full rounded px-2 py-1.5 text-left font-mono text-xs ${
                  p.pageNumber === currentPage
                    ? "bg-ink text-paper dark:bg-paper dark:text-ink"
                    : "text-ink-soft hover:bg-ink/5 dark:text-paper/60 dark:hover:bg-paper/5"
                }`}
              >
                Page {p.pageNumber}
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <main className="min-w-0">
        <h1 className="font-display text-2xl leading-snug">{document.title}</h1>
        <p className="mt-1 font-mono text-xs text-ink-faint dark:text-paper/40">
          {document.authors.join(", ")}
          {document.year ? ` · ${document.year}` : ""}
        </p>
        {document.abstract && (
          <p className="mt-4 max-w-prose font-sans text-sm italic leading-relaxed text-ink-soft dark:text-paper/70">
            {document.abstract}
          </p>
        )}
        <article className="mt-6 max-w-prose font-serif text-[15px] leading-relaxed text-ink dark:text-paper/90">
          <p className="mb-4 font-mono text-xs text-ink-faint dark:text-paper/40">Page {active?.pageNumber}</p>
          <p className="whitespace-pre-wrap">{active?.text}</p>
        </article>
      </main>

      <aside>
        <div className="rounded border border-hairline p-4 dark:border-hairline-dark">
          <p className="font-mono text-xs text-ink-faint dark:text-paper/40">Ask this paper</p>
          <div className="mt-2 flex gap-2">
            <Input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && ask()}
              placeholder="What dataset was used?"
              className="text-xs"
            />
            <Button size="sm" onClick={ask} disabled={isPending || !question.trim()}>
              {isPending ? "…" : "Ask"}
            </Button>
          </div>
          {error && <p className="mt-2 font-sans text-xs text-red-700 dark:text-red-400">{error}</p>}
          {result && (
            <div className="mt-3 font-sans text-xs leading-relaxed text-ink dark:text-paper/90">
              <ReactMarkdown components={{ p: (props) => <p className="mb-2 last:mb-0" {...props} /> }}>
                {result.answer}
              </ReactMarkdown>
              {result.citations.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {result.citations.map((c) => (
                    <button
                      key={c.pageNumber}
                      onClick={() => setCurrentPage(c.pageNumber)}
                      className="rounded-sm border border-teal/30 bg-teal/5 px-1.5 py-0.5 font-mono text-[11px] text-teal hover:bg-teal/10 dark:text-teal-muted"
                    >
                      Page {c.pageNumber}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
