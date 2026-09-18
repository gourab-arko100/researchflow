"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";
import { askAboutDocument } from "@/lib/actions/ai";
import { saveInsight } from "@/lib/actions/saved";
import { NotesPanel } from "@/components/reader/notes-panel";
import type { Citation } from "@/lib/ai/types";

type Page = { pageNumber: number; text: string };
type DocMeta = {
  id: string;
  title: string;
  fileName: string;
  fileSizeBytes: number;
  status: string;
  pageCount: number | null;
  createdAt: string;
  workspaceId: string;
  workspaceName: string;
};

function highlight(text: string, query: string) {
  if (!query.trim()) return text;
  const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"));
  return parts.map((part, i) =>
    part.toLowerCase() === query.toLowerCase() ? (
      <mark key={i} className="bg-brass/25 text-ink dark:bg-brass/40 dark:text-paper">
        {part}
      </mark>
    ) : (
      part
    )
  );
}

type Note = { id: string; content: string; pageNumber: number | null; tags: string[]; createdAt: string };

export function DocumentReader({
  document,
  pages,
  initialPage,
  initialNotes,
}: {
  document: DocMeta;
  pages: Page[];
  initialPage?: number;
  initialNotes: Note[];
}) {
  const [currentPage, setCurrentPage] = useState(
    initialPage && pages.some((p) => p.pageNumber === initialPage) ? initialPage : pages[0]?.pageNumber ?? 1
  );
  const [query, setQuery] = useState("");

  const matchingPages = useMemo(() => {
    if (!query.trim()) return null;
    const q = query.toLowerCase();
    return new Set(pages.filter((p) => p.text.toLowerCase().includes(q)).map((p) => p.pageNumber));
  }, [query, pages]);

  const active = pages.find((p) => p.pageNumber === currentPage) ?? pages[0];

  return (
    <div className="grid min-h-[calc(100vh-4rem)] grid-cols-1 lg:grid-cols-[200px_1fr_280px]">
      {/* LEFT — outline / page nav */}
      <aside className="border-b border-hairline p-4 lg:border-b-0 lg:border-r lg:overflow-y-auto dark:border-hairline-dark">
        <p className="font-mono text-xs text-ink-faint dark:text-paper/40">Pages ({pages.length})</p>
        <ul className="mt-3 space-y-0.5">
          {pages.map((p) => (
            <li key={p.pageNumber}>
              <button
                onClick={() => setCurrentPage(p.pageNumber)}
                className={`w-full rounded px-2 py-1.5 text-left font-mono text-xs transition-colors ${
                  p.pageNumber === currentPage
                    ? "bg-ink text-paper dark:bg-paper dark:text-ink"
                    : matchingPages?.has(p.pageNumber)
                      ? "bg-brass/10 text-ink dark:text-paper"
                      : "text-ink-soft hover:bg-ink/5 dark:text-paper/60 dark:hover:bg-paper/5"
                }`}
              >
                Page {p.pageNumber}
              </button>
            </li>
          ))}
        </ul>
      </aside>

      {/* CENTER — content */}
      <main className="min-w-0 overflow-y-auto p-6 lg:p-10">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search this document…"
          className="max-w-sm"
        />
        {query.trim() && (
          <p className="mt-2 font-mono text-xs text-ink-faint dark:text-paper/40">
            {matchingPages?.size ?? 0} of {pages.length} pages match
          </p>
        )}
        <article className="mt-6 max-w-prose font-serif text-[15px] leading-relaxed text-ink dark:text-paper/90">
          <p className="mb-4 font-mono text-xs text-ink-faint dark:text-paper/40">Page {active?.pageNumber}</p>
          {active?.text ? (
            <p className="whitespace-pre-wrap">{highlight(active.text, query)}</p>
          ) : (
            <p className="text-ink-faint dark:text-paper/40">This page had no extractable text.</p>
          )}
        </article>
        <div className="mt-8 flex gap-3">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
            className="font-mono text-xs text-ink-soft hover:text-ink disabled:opacity-30 dark:text-paper/60 dark:hover:text-paper"
          >
            ← Prev
          </button>
          <button
            onClick={() => setCurrentPage((p) => Math.min(pages.length, p + 1))}
            disabled={currentPage >= pages.length}
            className="font-mono text-xs text-ink-soft hover:text-ink disabled:opacity-30 dark:text-paper/60 dark:hover:text-paper"
          >
            Next →
          </button>
        </div>
      </main>

      {/* RIGHT — document info (AI assistant panel lands in Phase 6) */}
      <aside className="border-t border-hairline p-5 lg:border-l lg:border-t-0 dark:border-hairline-dark">
        <Link
          href={`/workspace/${document.workspaceId}`}
          className="font-mono text-xs text-ink-faint hover:text-ink dark:text-paper/40 dark:hover:text-paper"
        >
          ← {document.workspaceName}
        </Link>
        <h1 className="mt-3 font-display text-lg leading-snug">{document.title}</h1>
        <div className="mt-4">
          <StatusBadge status={document.status} />
        </div>
        <dl className="mt-5 space-y-2 font-sans text-xs">
          <div className="flex justify-between gap-2">
            <dt className="text-ink-faint dark:text-paper/40">File</dt>
            <dd className="truncate text-right text-ink-soft dark:text-paper/70">{document.fileName}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-ink-faint dark:text-paper/40">Size</dt>
            <dd className="text-ink-soft dark:text-paper/70">{(document.fileSizeBytes / 1024 / 1024).toFixed(1)}MB</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-ink-faint dark:text-paper/40">Pages</dt>
            <dd className="text-ink-soft dark:text-paper/70">{document.pageCount ?? "—"}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-ink-faint dark:text-paper/40">Uploaded</dt>
            <dd className="text-ink-soft dark:text-paper/70">{new Date(document.createdAt).toLocaleDateString()}</dd>
          </div>
        </dl>
        <div className="mt-6 rounded border border-hairline p-4 dark:border-hairline-dark">
          {document.status === "READY" ? (
            <QuickAsk documentId={document.id} onJumpToPage={setCurrentPage} />
          ) : (
            <p className="font-mono text-xs text-ink-faint dark:text-paper/40">
              Ask AI becomes available once this document finishes indexing.
            </p>
          )}
          <Link
            href={`/workspace/${document.workspaceId}/chat`}
            className="mt-3 block font-mono text-xs text-teal hover:underline dark:text-teal-muted"
          >
            Full multi-turn, multi-paper chat →
          </Link>
          {document.status === "READY" && (
            <Link
              href={`/document/${document.id}/summary`}
              className="mt-1 block font-mono text-xs text-teal hover:underline dark:text-teal-muted"
            >
              Structured summary →
            </Link>
          )}
        </div>

        <NotesPanel
          documentId={document.id}
          currentPage={currentPage}
          initialNotes={initialNotes}
          onJumpToPage={setCurrentPage}
        />
      </aside>
    </div>
  );
}

function QuickAsk({ documentId, onJumpToPage }: { documentId: string; onJumpToPage: (page: number) => void }) {
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState<{ answer: string; citations: Citation[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  const submit = () => {
    if (!question.trim()) return;
    setError(null);
    setSaved(false);
    startTransition(async () => {
      try {
        const res = await askAboutDocument(documentId, question);
        setResult(res);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
    });
  };

  const save = () => {
    if (!result) return;
    setSaved(true);
    startTransition(async () => {
      await saveInsight("ai_response", result.answer, documentId);
    });
  };

  return (
    <div>
      <p className="font-mono text-xs text-ink-faint dark:text-paper/40">
        Ask this document — a quick single-question test; full chat is below
      </p>
      <div className="mt-2 flex gap-2">
        <Input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="What method did the authors use?"
          className="text-xs"
        />
        <Button size="sm" onClick={submit} disabled={isPending || !question.trim()}>
          {isPending ? "…" : "Ask"}
        </Button>
      </div>
      {error && <p className="mt-2 font-sans text-xs text-red-700 dark:text-red-400">{error}</p>}
      {result && (
        <div className="mt-3">
          <div className="font-sans text-xs leading-relaxed text-ink dark:text-paper/90">
            <ReactMarkdown
              components={{
                p: (props) => <p className="mb-2 last:mb-0" {...props} />,
                strong: (props) => <strong className="font-semibold" {...props} />,
                ul: (props) => <ul className="mb-2 ml-4 list-disc space-y-0.5" {...props} />,
                ol: (props) => <ol className="mb-2 ml-4 list-decimal space-y-0.5" {...props} />,
                li: (props) => <li {...props} />,
                h1: (props) => <p className="mb-1 font-semibold" {...props} />,
                h2: (props) => <p className="mb-1 font-semibold" {...props} />,
                h3: (props) => <p className="mb-1 font-semibold" {...props} />,
              }}
            >
              {result.answer}
            </ReactMarkdown>
          </div>
          {result.citations.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {result.citations.map((c) => (
                <button
                  key={c.pageNumber}
                  onClick={() => onJumpToPage(c.pageNumber)}
                  className="rounded-sm border border-teal/30 bg-teal/5 px-1.5 py-0.5 font-mono text-[11px] text-teal hover:bg-teal/10 dark:text-teal-muted"
                >
                  Page {c.pageNumber}
                </button>
              ))}
            </div>
          )}
          <button
            onClick={save}
            disabled={saved}
            className="mt-2 font-mono text-[11px] text-brass hover:underline disabled:no-underline disabled:opacity-60"
          >
            {saved ? "Saved" : "Save this answer"}
          </button>
        </div>
      )}
    </div>
  );
}
