import type {
  AnalysisDocument,
  ComparisonResult,
  DocumentAnalysisService,
  SummaryMode,
  SummaryResult,
} from "@/lib/ai/analysis/types";
import { COMPARISON_CATEGORIES } from "@/lib/ai/analysis/types";
import { extractField, extractOverview } from "@/lib/ai/analysis/heuristics";

const DEMO_NOTE =
  "Demo mode extracts these fields with keyword matching over your actual document text — connect a Gemini API key for a written, synthesized summary.";

export class DemoDocumentAnalysisService implements DocumentAnalysisService {
  readonly providerName = "demo" as const;

  async summarize(document: AnalysisDocument, mode: SummaryMode): Promise<SummaryResult> {
    if (mode !== "structured") {
      const overview = extractOverview(document.pages);
      return { mode, text: `${overview}\n\n(${DEMO_NOTE})` };
    }

    return {
      mode,
      structured: {
        overview: extractOverview(document.pages),
        researchProblem: extractField(document.pages, "researchProblem"),
        methodology: extractField(document.pages, "methodology"),
        dataset: extractField(document.pages, "dataset"),
        results: extractField(document.pages, "results"),
        limitations: extractField(document.pages, "limitations"),
        futureWork: extractField(document.pages, "futureWork"),
      },
    };
  }

  async compare(documents: AnalysisDocument[]): Promise<ComparisonResult> {
    const fieldByCategory: Record<(typeof COMPARISON_CATEGORIES)[number], Parameters<typeof extractField>[1]> = {
      "Research Problem": "researchProblem",
      Methodology: "methodology",
      Dataset: "dataset",
      Model: "methodology", // no separate keyword set — methodology text usually names the model too
      Evaluation: "results",
      Results: "results",
      Limitations: "limitations",
    };

    const rows = COMPARISON_CATEGORIES.map((category) => ({
      category,
      values: documents.map((doc) => extractField(doc.pages, fieldByCategory[category])),
    }));

    return {
      papers: documents.map((d) => ({ id: d.id, title: d.title })),
      rows,
      narrative: `${DEMO_NOTE} The table reflects the extracted text of each paper independently — it doesn't synthesize a written comparison across them.`,
    };
  }
}
