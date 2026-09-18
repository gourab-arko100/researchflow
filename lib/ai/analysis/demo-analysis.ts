import type { ComparisonInput, DocumentAnalysisService, LitReviewTheme, StructuredSummary } from "@/lib/ai/types";

/**
 * No LLM call. Splitting a paper into "research problem" vs "methodology"
 * vs "limitations" genuinely requires reading comprehension a hashing
 * vectorizer doesn't have — faking that split with keyword heuristics would
 * likely mislabel things, which is worse than admitting it's not available.
 * So Demo mode gives an honest extractive overview (first few real sentences
 * of the paper) and leaves the rest empty rather than guessing. Likewise,
 * grouping papers into real research themes or writing a synthesized
 * comparison/gap analysis needs genuine synthesis — Demo mode says so
 * plainly instead of faking it.
 */
export class DemoDocumentAnalysisService implements DocumentAnalysisService {
  readonly providerName = "demo" as const;

  async summarize(fullText: string): Promise<StructuredSummary> {
    return {
      overview: extractOverview(fullText),
      researchProblem: "",
      methodology: "",
      dataset: "",
      results: "",
      limitations: "",
      futureWork: "",
    };
  }

  async compare(papers: ComparisonInput[]): Promise<string> {
    const list = papers.map((p) => `- **${p.title}**: ${p.summary.overview || "no overview available"}`).join("\n");
    return `Writing a synthesized comparison needs a generative model, which requires a Gemini API key in Demo mode (see README). Here are the extracted overviews side by side instead:\n\n${list}`;
  }

  async findResearchGaps(papers: ComparisonInput[]): Promise<string> {
    const withLimitations = papers.filter((p) => p.summary.limitations);
    if (withLimitations.length === 0) {
      return "Identifying research gaps needs a generative model to read between the lines, which requires a Gemini API key in Demo mode (see README). Generate a structured summary for these papers first — once a paper has a cached Limitations field, it'll show up here.";
    }
    const list = withLimitations.map((p) => `- **${p.title}**: ${p.summary.limitations}`).join("\n");
    return `Synthesizing genuine cross-paper gaps needs a generative model (Gemini API key required — see README). Here are each paper's own extracted limitations, unsynthesized:\n\n${list}`;
  }

  async generateLiteratureReview(papers: ComparisonInput[]): Promise<LitReviewTheme[]> {
    return [
      {
        title: "All papers (Demo mode — not thematically grouped)",
        paperIds: papers.map((p) => p.documentId),
        text: `Grouping papers into real research themes needs a generative model, which requires a Gemini API key in Demo mode (see README). Here are their extracted overviews:\n\n${papers
          .map((p) => `- **${p.title}**: ${p.summary.overview || "no overview available"}`)
          .join("\n")}`,
      },
    ];
  }

  async regenerateThemeText(theme: { title: string; papers: ComparisonInput[] }): Promise<string> {
    return `Regenerating a themed synthesis needs a generative model, which requires a Gemini API key in Demo mode (see README). Papers in this section: ${theme.papers.map((p) => p.title).join(", ")}.`;
  }
}

function extractOverview(text: string, maxLength = 500): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) return normalized;
  return normalized.slice(0, maxLength).replace(/\s+\S*$/, "") + "…";
}
