"use client";

import { useState, useTransition } from "react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { generateLiteratureReview, regenerateReviewTheme } from "@/lib/actions/analysis";
import type { LitReviewTheme } from "@/lib/ai/types";

type Doc = { id: string; title: string };

function ThemeSection({
  theme,
  allDocumentIds,
  onChange,
}: {
  theme: LitReviewTheme;
  allDocumentIds: string[];
  onChange: (text: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(theme.text);
  const [isPending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);

  const regenerate = () => {
    startTransition(async () => {
      const text = await regenerateReviewTheme(theme.title, theme.paperIds, allDocumentIds);
      setDraft(text);
      onChange(text);
    });
  };

  const copy = async () => {
    await navigator.clipboard.writeText(`## ${theme.title}\n\n${draft}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="border-t border-hairline pt-6 dark:border-hairline-dark">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-display text-lg">{theme.title}</h3>
        <div className="flex gap-3">
          <button
            onClick={() => setEditing((e) => !e)}
            className="font-mono text-xs text-teal hover:underline dark:text-teal-muted"
          >
            {editing ? "Done" : "Edit"}
          </button>
          <button
            onClick={regenerate}
            disabled={isPending}
            className="font-mono text-xs text-teal hover:underline disabled:opacity-50 dark:text-teal-muted"
          >
            {isPending ? "Regenerating…" : "Regenerate"}
          </button>
          <button onClick={copy} className="font-mono text-xs text-teal hover:underline dark:text-teal-muted">
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </div>

      {editing ? (
        <textarea
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            onChange(e.target.value);
          }}
          rows={6}
          className="mt-3 w-full rounded border border-hairline bg-paper-raised p-3 font-sans text-sm text-ink dark:border-hairline-dark dark:bg-paper-dark-raised dark:text-paper"
        />
      ) : (
        <div className="mt-3 font-sans text-sm leading-relaxed text-ink dark:text-paper/90">
          <ReactMarkdown
            components={{
              p: (props) => <p className="mb-2 last:mb-0" {...props} />,
              strong: (props) => <strong className="font-semibold" {...props} />,
              em: (props) => <em className="italic" {...props} />,
            }}
          >
            {draft}
          </ReactMarkdown>
        </div>
      )}
    </div>
  );
}

export function LiteratureReviewView({ documents }: { documents: Doc[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [themes, setThemes] = useState<LitReviewTheme[] | null>(null);
  const [allIds, setAllIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < 8) next.add(id);
      return next;
    });
  };

  const generate = () => {
    setError(null);
    startTransition(async () => {
      try {
        const ids = [...selected];
        const res = await generateLiteratureReview(ids);
        setThemes(res.themes);
        setAllIds(ids);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
    });
  };

  const exportDraft = () => {
    if (!themes) return;
    const text = themes.map((t) => `## ${t.title}\n\n${t.text}`).join("\n\n");
    const blob = new Blob([text], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "literature-review.md";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (documents.length < 2) {
    return (
      <p className="font-sans text-sm text-ink-faint dark:text-paper/40">
        You need at least 2 papers marked "Ready" in this workspace for a literature review.
      </p>
    );
  }

  if (themes) {
    return (
      <div>
        <div className="flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={() => setThemes(null)}>
            ← Choose different papers
          </Button>
          <Button size="sm" onClick={exportDraft}>
            Export .md
          </Button>
        </div>
        <div className="mt-6 space-y-8">
          {themes.map((theme, i) => (
            <ThemeSection
              key={theme.title + i}
              theme={theme}
              allDocumentIds={allIds}
              onChange={(text) =>
                setThemes((prev) => prev!.map((t, idx) => (idx === i ? { ...t, text } : t)))
              }
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <p className="font-sans text-sm text-ink-soft dark:text-paper/70">
        Select 2–8 papers. They'll be grouped into themes automatically.
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
      <Button className="mt-4" onClick={generate} disabled={selected.size < 2 || isPending}>
        {isPending ? "Drafting…" : `Generate draft (${selected.size})`}
      </Button>
    </div>
  );
}
