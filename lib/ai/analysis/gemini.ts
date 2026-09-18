import { GoogleGenAI } from "@google/genai";
import type {
  AnalysisDocument,
  ComparisonResult,
  DocumentAnalysisService,
  SummaryMode,
  SummaryResult,
} from "@/lib/ai/analysis/types";
import { COMPARISON_CATEGORIES } from "@/lib/ai/analysis/types";

const MAX_CHARS_PER_DOC = 30000; // headroom for gemini-2.5-flash's context; a full paper fits comfortably

function fullText(document: AnalysisDocument): string {
  const text = document.pages.map((p) => p.text).join("\n\n");
  return text.length > MAX_CHARS_PER_DOC ? text.slice(0, MAX_CHARS_PER_DOC) + "\n\n[truncated]" : text;
}

/** Strips ```json fences a model sometimes adds despite instructions, then parses. */
function parseJson<T>(raw: string): T | null {
  const cleaned = raw.replace(/```json\s*|```\s*$/g, "").trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    return null;
  }
}

export class GeminiDocumentAnalysisService implements DocumentAnalysisService {
  readonly providerName = "gemini" as const;
  private client: GoogleGenAI;

  constructor(apiKey: string) {
    this.client = new GoogleGenAI({ apiKey });
  }

  async summarize(document: AnalysisDocument, mode: SummaryMode): Promise<SummaryResult> {
    if (mode === "structured") {
      const prompt = `You are summarizing a research paper. Respond ONLY with a JSON object (no markdown fences, no commentary) with exactly these string keys: overview, researchProblem, methodology, dataset, results, limitations, futureWork. Base every field strictly on the paper text below — if a section genuinely isn't present in the text, say so in that field rather than inventing content.

Paper: ${document.title}

${fullText(document)}`;

      const response = await this.client.models.generateContent({ model: "gemini-2.5-flash", contents: prompt });
      const parsed = parseJson<Record<string, string>>(response.text ?? "");

      if (!parsed) {
        return { mode, text: response.text?.trim() || "Could not generate a summary." };
      }
      return {
        mode,
        structured: {
          overview: parsed.overview ?? "",
          researchProblem: parsed.researchProblem ?? "",
          methodology: parsed.methodology ?? "",
          dataset: parsed.dataset ?? "",
          results: parsed.results ?? "",
          limitations: parsed.limitations ?? "",
          futureWork: parsed.futureWork ?? "",
        },
      };
    }

    const lengthInstruction =
      mode === "brief" ? "in 3-4 sentences" : "in 2-3 well-organized paragraphs, covering problem, method, and findings";

    const prompt = `Summarize this research paper ${lengthInstruction}. Base it strictly on the text provided — don't invent results or claims not present in the text.

Paper: ${document.title}

${fullText(document)}`;

    const response = await this.client.models.generateContent({ model: "gemini-2.5-flash", contents: prompt });
    return { mode, text: response.text?.trim() || "Could not generate a summary." };
  }

  async compare(documents: AnalysisDocument[]): Promise<ComparisonResult> {
    const papersBlock = documents
      .map((d, i) => `### Paper ${i + 1}: ${d.title}\n${fullText(d)}`)
      .join("\n\n");

    const categories = COMPARISON_CATEGORIES.join(", ");
    const prompt = `Compare these ${documents.length} research papers. Respond ONLY with a JSON object (no markdown fences) shaped like:
{"rows": [{"category": "Research Problem", "values": ["...", "..."]}, ...], "narrative": "..."}

Include exactly one row per category, in this order: ${categories}. "values" must have exactly ${documents.length} entries, one per paper in the order given, each 1-3 sentences. "narrative" is a short written comparison (2-4 paragraphs) discussing how the papers relate — agreements, differences, and gaps. Base everything strictly on the paper text below; if a paper doesn't address a category, say so for that paper rather than inventing content.

${papersBlock}`;

    const response = await this.client.models.generateContent({ model: "gemini-2.5-flash", contents: prompt });
    const parsed = parseJson<{ rows: { category: string; values: string[] }[]; narrative: string }>(
      response.text ?? ""
    );

    if (!parsed) {
      return {
        papers: documents.map((d) => ({ id: d.id, title: d.title })),
        rows: [],
        narrative: response.text?.trim() || "Could not generate a comparison.",
      };
    }

    return {
      papers: documents.map((d) => ({ id: d.id, title: d.title })),
      rows: parsed.rows as ComparisonResult["rows"],
      narrative: parsed.narrative,
    };
  }
}
