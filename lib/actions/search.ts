"use server";

import { getOrCreateCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export type SearchResult = {
  kind: "paper" | "page" | "note" | "summary";
  documentId: string;
  documentTitle: string;
  workspaceId: string;
  pageNumber?: number;
  snippet: string;
  noteId?: string;
};

/** Plain keyword search (ILIKE, via Prisma's insensitive mode) — no AI call,
 * per the spec's cost-control guidance: deterministic code handles this fine. */
export async function globalSearch(query: string): Promise<SearchResult[]> {
  const user = await getOrCreateCurrentUser();
  if (!user) return [];

  const q = query.trim();
  if (q.length < 2) return [];

  const results: SearchResult[] = [];

  const papers = await db.document.findMany({
    where: { workspace: { ownerId: user.id }, title: { contains: q, mode: "insensitive" } },
    select: { id: true, title: true, workspaceId: true },
    take: 10,
  });
  for (const p of papers) {
    results.push({ kind: "paper", documentId: p.id, documentTitle: p.title, workspaceId: p.workspaceId, snippet: p.title });
  }

  const pages = await db.documentPage.findMany({
    where: { text: { contains: q, mode: "insensitive" }, document: { workspace: { ownerId: user.id } } },
    select: { pageNumber: true, text: true, document: { select: { id: true, title: true, workspaceId: true } } },
    take: 15,
  });
  for (const p of pages) {
    results.push({
      kind: "page",
      documentId: p.document.id,
      documentTitle: p.document.title,
      workspaceId: p.document.workspaceId,
      pageNumber: p.pageNumber,
      snippet: buildSnippet(p.text, q),
    });
  }

  const notes = await db.note.findMany({
    where: { userId: user.id, content: { contains: q, mode: "insensitive" } },
    select: { id: true, content: true, documentId: true, pageNumber: true, document: { select: { title: true, workspaceId: true } } },
    take: 10,
  });
  for (const n of notes) {
    if (!n.documentId || !n.document) continue;
    results.push({
      kind: "note",
      documentId: n.documentId,
      documentTitle: n.document.title,
      workspaceId: n.document.workspaceId,
      pageNumber: n.pageNumber ?? undefined,
      snippet: buildSnippet(n.content, q),
      noteId: n.id,
    });
  }

  const summaryDocs = await db.document.findMany({
    where: {
      workspace: { ownerId: user.id },
      OR: [
        { abstract: { contains: q, mode: "insensitive" } },
        { researchProblem: { contains: q, mode: "insensitive" } },
        { methodology: { contains: q, mode: "insensitive" } },
        { results: { contains: q, mode: "insensitive" } },
        { limitations: { contains: q, mode: "insensitive" } },
      ],
    },
    select: { id: true, title: true, workspaceId: true, abstract: true, researchProblem: true, methodology: true, results: true, limitations: true },
    take: 10,
  });
  for (const d of summaryDocs) {
    const field = [d.abstract, d.researchProblem, d.methodology, d.results, d.limitations].find(
      (f) => f && f.toLowerCase().includes(q.toLowerCase())
    );
    results.push({
      kind: "summary",
      documentId: d.id,
      documentTitle: d.title,
      workspaceId: d.workspaceId,
      snippet: buildSnippet(field ?? "", q),
    });
  }

  return results;
}

function buildSnippet(text: string, query: string, context = 80): string {
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text.slice(0, 160);
  const start = Math.max(0, idx - context);
  const end = Math.min(text.length, idx + query.length + context);
  return (start > 0 ? "…" : "") + text.slice(start, end).trim() + (end < text.length ? "…" : "");
}
