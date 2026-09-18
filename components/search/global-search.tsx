"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { globalSearch, type SearchResult } from "@/lib/actions/search";

const KIND_LABELS: Record<SearchResult["kind"], string> = {
  paper: "Title",
  page: "Page text",
  note: "Note",
  summary: "Summary",
};

export function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isPending, startTransition] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(() => {
      startTransition(async () => {
        setResults(await globalSearch(query));
      });
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  return (
    <div>
      <Input
        autoFocus
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search titles, page text, notes, summaries…"
      />
      {isPending && <p className="mt-3 font-mono text-xs text-ink-faint dark:text-paper/40">Searching…</p>}
      {!isPending && query.trim().length >= 2 && results.length === 0 && (
        <p className="mt-3 font-sans text-sm text-ink-faint dark:text-paper/40">No matches.</p>
      )}
      <ul className="mt-4 divide-y divide-hairline border-t border-hairline dark:divide-hairline-dark dark:border-hairline-dark">
        {results.map((r, i) => (
          <li key={i} className="py-3">
            <Link
              href={r.kind === "paper" ? `/document/${r.documentId}` : `/document/${r.documentId}${r.pageNumber ? `?page=${r.pageNumber}` : ""}`}
              className="block hover:opacity-70"
            >
              <div className="flex items-center gap-2">
                <span className="rounded-sm border border-hairline px-1.5 py-0.5 font-mono text-[10px] text-ink-faint dark:border-hairline-dark dark:text-paper/40">
                  {KIND_LABELS[r.kind]}
                </span>
                <span className="font-sans text-sm text-ink dark:text-paper">{r.documentTitle}</span>
                {r.pageNumber && (
                  <span className="font-mono text-xs text-ink-faint dark:text-paper/40">p.{r.pageNumber}</span>
                )}
              </div>
              <p className="mt-1 font-sans text-xs text-ink-soft dark:text-paper/60">{r.snippet}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
