"use server";

import { revalidatePath } from "next/cache";
import { getOrCreateCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getDocumentAnalysisService } from "@/lib/ai";
import type { LitReviewTheme, StructuredSummary } from "@/lib/ai/types";
import { assertRateLimit } from "@/lib/rate-limit";

function hasCachedSummary(doc: {
  researchProblem: string | null;
  methodology: string | null;
  results: string | null;
}): boolean {
  return Boolean(doc.researchProblem || doc.methodology || doc.results);
}

/** Generates (or returns the cached) structured summary for a document.
 * Cost control: a document is only ever summarized once unless `force` is
 * passed — the result is cached directly on the Document row. */
export async function getOrGenerateSummary(documentId: string, force = false): Promise<StructuredSummary> {
  const user = await getOrCreateCurrentUser();
  if (!user) throw new Error("Not signed in");

  const document = await db.document.findFirst({
    where: { id: documentId, workspace: { ownerId: user.id } },
    include: { pages: { orderBy: { pageNumber: "asc" }, select: { text: true } } },
  });
  if (!document) throw new Error("Document not found");
  if (document.status !== "READY") throw new Error("This document isn't fully indexed yet");

  if (!force && hasCachedSummary(document)) {
    return {
      overview: document.abstract ?? "",
      researchProblem: document.researchProblem ?? "",
      methodology: document.methodology ?? "",
      dataset: document.dataset ?? "",
      results: document.results ?? "",
      limitations: document.limitations ?? "",
      futureWork: "",
    };
  }

  const fullText = document.pages.map((p) => p.text).join("\n\n");
  const analysisService = getDocumentAnalysisService();
  assertRateLimit(`summarize:${user.id}`, 15, 5 * 60 * 1000);
  const summary = await analysisService.summarize(fullText, document.title);

  await db.document.update({
    where: { id: documentId },
    data: {
      abstract: summary.overview || document.abstract,
      researchProblem: summary.researchProblem || null,
      methodology: summary.methodology || null,
      dataset: summary.dataset || null,
      results: summary.results || null,
      limitations: summary.limitations || null,
    },
  });

  revalidatePath(`/document/${documentId}/summary`);
  return summary;
}

/** Shared by compare/gaps/lit-review: resolves a set of document ids to
 * READY documents the current user owns, each with its (cached-or-generated)
 * structured summary attached. */
async function resolvePapersWithSummaries(documentIds: string[]) {
  const user = await getOrCreateCurrentUser();
  if (!user) throw new Error("Not signed in");

  const documents = await db.document.findMany({
    where: { id: { in: documentIds }, workspace: { ownerId: user.id }, status: "READY" },
    select: { id: true, title: true },
  });

  return Promise.all(
    documents.map(async (doc) => ({
      documentId: doc.id,
      title: doc.title,
      summary: await getOrGenerateSummary(doc.id),
    }))
  );
}

export async function compareDocuments(documentIds: string[]): Promise<{
  papers: { documentId: string; title: string; summary: StructuredSummary }[];
  narrative: string;
}> {
  const user = await getOrCreateCurrentUser();
  if (!user) throw new Error("Not signed in");

  if (documentIds.length < 2 || documentIds.length > 5) {
    throw new Error("Select between 2 and 5 papers to compare");
  }

  const papers = await resolvePapersWithSummaries(documentIds);
  if (papers.length < 2) throw new Error("Not enough ready papers among the selection");

  assertRateLimit(`analysis:${user.id}`, 10, 5 * 60 * 1000);
  const analysisService = getDocumentAnalysisService();
  const narrative = await analysisService.compare(papers);

  return { papers, narrative };
}

export async function generateResearchGaps(documentIds: string[]): Promise<{
  papers: { documentId: string; title: string; summary: StructuredSummary }[];
  markdown: string;
}> {
  const user = await getOrCreateCurrentUser();
  if (!user) throw new Error("Not signed in");

  if (documentIds.length === 0) throw new Error("Select at least one paper");
  if (documentIds.length > 6) throw new Error("Select at most 6 papers");

  const papers = await resolvePapersWithSummaries(documentIds);
  if (papers.length === 0) throw new Error("None of the selected papers are ready yet");

  assertRateLimit(`analysis:${user.id}`, 10, 5 * 60 * 1000);
  const analysisService = getDocumentAnalysisService();
  const markdown = await analysisService.findResearchGaps(papers);

  return { papers, markdown };
}

export async function generateLiteratureReview(documentIds: string[]): Promise<{
  papers: { documentId: string; title: string; summary: StructuredSummary }[];
  themes: LitReviewTheme[];
}> {
  const user = await getOrCreateCurrentUser();
  if (!user) throw new Error("Not signed in");

  if (documentIds.length < 2) throw new Error("Select at least 2 papers for a literature review");
  if (documentIds.length > 8) throw new Error("Select at most 8 papers");

  const papers = await resolvePapersWithSummaries(documentIds);
  if (papers.length < 2) throw new Error("Not enough ready papers among the selection");

  assertRateLimit(`analysis:${user.id}`, 10, 5 * 60 * 1000);
  const analysisService = getDocumentAnalysisService();
  const themes = await analysisService.generateLiteratureReview(papers);

  return { papers, themes };
}

export async function regenerateReviewTheme(
  themeTitle: string,
  paperIds: string[],
  allDocumentIds: string[]
): Promise<string> {
  const user = await getOrCreateCurrentUser();
  if (!user) throw new Error("Not signed in");

  const papers = await resolvePapersWithSummaries(allDocumentIds);
  const themePapers = papers.filter((p) => paperIds.includes(p.documentId));
  if (themePapers.length === 0) throw new Error("No papers found for this section");

  assertRateLimit(`analysis:${user.id}`, 10, 5 * 60 * 1000);
  const analysisService = getDocumentAnalysisService();
  return analysisService.regenerateThemeText({ title: themeTitle, papers: themePapers });
}
