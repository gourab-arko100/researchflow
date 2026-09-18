import { GoogleGenAI } from "@google/genai";
import type { ComparisonInput, DocumentAnalysisService, LitReviewTheme, StructuredSummary } from "@/lib/ai/types";
import { withGeminiRetry } from "@/lib/ai/retry";

const EMPTY_SUMMARY: StructuredSummary = {
  overview: "",
  researchProblem: "",
  methodology: "",
  dataset: "",
  results: "",
  limitations: "",
  futureWork: "",
};

// Keeps the summarization call cheap and within context comfortably — most
// papers' problem/method/results/limitations show up well within the first
// ~18k characters (abstract through discussion), even before a conclusion.
const MAX_SUMMARY_INPUT_CHARS = 18000;

export class GeminiDocumentAnalysisService implements DocumentAnalysisService {
  readonly providerName = "gemini" as const;
  private client: GoogleGenAI;

  constructor(apiKey: string) {
    this.client = new GoogleGenAI({ apiKey });
  }

  async summarize(fullText: string, title: string): Promise<StructuredSummary> {
    const truncated = fullText.slice(0, MAX_SUMMARY_INPUT_CHARS);

    const prompt = `You are a research assistant extracting a structured summary of an academic paper titled "${title}". Read the text below and respond with ONLY a JSON object (no markdown fences, no commentary) with exactly these string fields: overview, researchProblem, methodology, dataset, results, limitations, futureWork. Each field should be 1-4 sentences, in your own words, based only on the text given. If the text doesn't cover a field (e.g. no dataset is mentioned), use an empty string for that field rather than guessing.

Paper text:
${truncated}

JSON:`;

    const response = await withGeminiRetry(() =>
      this.client.models.generateContent({ model: "gemini-3.6-flash", contents: prompt })
    );

    return parseSummaryJson(response.text ?? "");
  }

  async compare(papers: ComparisonInput[]): Promise<string> {
    const context = papers
      .map(
        (p, i) => `Paper ${i + 1}: "${p.title}"
- Research problem: ${p.summary.researchProblem || "not stated"}
- Methodology: ${p.summary.methodology || "not stated"}
- Dataset: ${p.summary.dataset || "not stated"}
- Results: ${p.summary.results || "not stated"}
- Limitations: ${p.summary.limitations || "not stated"}`
      )
      .join("\n\n");

    const prompt = `You are a research assistant. Below are structured summaries of ${papers.length} papers. Write a short comparative analysis (Markdown, use headers and bullet points) covering: what problem each addresses, how their methods differ, and how their limitations compare. Only draw on what's given below — do not invent details. If something wasn't captured in a summary, say it isn't stated rather than guessing.

${context}

Comparative analysis:`;

    const response = await withGeminiRetry(() =>
      this.client.models.generateContent({ model: "gemini-3.6-flash", contents: prompt })
    );

    return response.text?.trim() || "Comparison could not be generated.";
  }

  async findResearchGaps(papers: ComparisonInput[]): Promise<string> {
    const context = papers
      .map(
        (p) => `Paper: "${p.title}"
- Research problem: ${p.summary.researchProblem || "not stated"}
- Methodology: ${p.summary.methodology || "not stated"}
- Dataset: ${p.summary.dataset || "not stated"}
- Results: ${p.summary.results || "not stated"}
- Limitations: ${p.summary.limitations || "not stated"}`
      )
      .join("\n\n");

    const prompt = `You are a research assistant helping a researcher identify potential gaps in the literature. Based ONLY on the structured summaries below, write an analysis covering whichever of these are actually supported by the summaries — skip any with nothing to say: Common Limitations (shared across papers), Underexplored Areas, Dataset Limitations, Methodological Limitations, Evaluation Limitations, and Suggested Future Research Directions. For every point, name which paper(s) it relates to by title. Do not invent limitations or gaps that aren't implied by the summaries — if the summaries don't support a category, omit it rather than guessing. Format as Markdown with headers.

Papers:
${context}

Analysis:`;

    const response = await withGeminiRetry(() =>
      this.client.models.generateContent({ model: "gemini-3.6-flash", contents: prompt })
    );

    return response.text?.trim() || "Could not generate a research-gap analysis from these summaries.";
  }

  async generateLiteratureReview(papers: ComparisonInput[]): Promise<LitReviewTheme[]> {
    const context = papers
      .map(
        (p) => `id: ${p.documentId}
title: "${p.title}"
overview: ${p.summary.overview || "not stated"}
research problem: ${p.summary.researchProblem || "not stated"}
methodology: ${p.summary.methodology || "not stated"}
results: ${p.summary.results || "not stated"}`
      )
      .join("\n\n");

    const prompt = `You are a research assistant drafting a literature review. Group the following papers into 2-4 thematic groups based on shared research problems or methodological approaches. Respond with ONLY a JSON object: { "themes": [ { "title": string, "paperIds": string[] (use the exact ids given), "text": string } ] }. Every paper id must appear in exactly one theme's paperIds. "text" should be a 2-4 sentence synthesis paragraph (plain text, Markdown bold/italic ok) that cites papers by title in parentheses, based only on the summaries given — do not invent findings not present below.

Papers:
${context}

JSON:`;

    const response = await withGeminiRetry(() =>
      this.client.models.generateContent({ model: "gemini-3.6-flash", contents: prompt })
    );

    return parseThemesJson(response.text ?? "", papers);
  }

  async regenerateThemeText(theme: { title: string; papers: ComparisonInput[] }): Promise<string> {
    const context = theme.papers
      .map((p) => `"${p.title}": ${p.summary.overview || p.summary.researchProblem || "not stated"}`)
      .join("\n");

    const prompt = `Write a fresh 2-4 sentence literature-review paragraph (plain text, Markdown bold/italic ok) for the theme "${theme.title}", synthesizing these papers. Cite each by title in parentheses. Base it only on what's given — don't invent findings.

${context}

Paragraph:`;

    const response = await withGeminiRetry(() =>
      this.client.models.generateContent({ model: "gemini-3.6-flash", contents: prompt })
    );

    return response.text?.trim() || "Could not regenerate this section.";
  }
}

function parseThemesJson(raw: string, papers: ComparisonInput[]): LitReviewTheme[] {
  const cleaned = raw.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  try {
    const parsed = JSON.parse(cleaned);
    const themes = Array.isArray(parsed.themes) ? parsed.themes : [];
    if (themes.length === 0) throw new Error("empty themes");
    return themes.map((t: { title?: unknown; paperIds?: unknown; text?: unknown }) => ({
      title: String(t.title ?? "Untitled theme"),
      paperIds: Array.isArray(t.paperIds) ? t.paperIds.map(String) : [],
      text: String(t.text ?? ""),
    }));
  } catch {
    console.error("Failed to parse literature review JSON from Gemini:", raw.slice(0, 500));
    // Fail soft: one theme holding everything, rather than crashing the request.
    return [
      {
        title: "All papers",
        paperIds: papers.map((p) => p.documentId),
        text: "Theming didn't return a usable result — try regenerating.",
      },
    ];
  }
}

function parseSummaryJson(raw: string): StructuredSummary {
  const cleaned = raw.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  try {
    const parsed = JSON.parse(cleaned);
    return {
      overview: String(parsed.overview ?? ""),
      researchProblem: String(parsed.researchProblem ?? ""),
      methodology: String(parsed.methodology ?? ""),
      dataset: String(parsed.dataset ?? ""),
      results: String(parsed.results ?? ""),
      limitations: String(parsed.limitations ?? ""),
      futureWork: String(parsed.futureWork ?? ""),
    };
  } catch {
    // Model didn't return clean JSON — fail soft with an empty structured
    // summary rather than crashing the whole request; the raw text is at
    // least visible in server logs for debugging.
    console.error("Failed to parse summary JSON from Gemini:", raw.slice(0, 500));
    return { ...EMPTY_SUMMARY, overview: "Summary generation didn't return a usable result — try again." };
  }
}
