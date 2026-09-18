export type SummaryMode = "brief" | "detailed" | "structured";

export interface StructuredSummary {
  overview: string;
  researchProblem: string;
  methodology: string;
  dataset: string;
  results: string;
  limitations: string;
  futureWork: string;
}

export interface SummaryResult {
  mode: SummaryMode;
  text?: string; // brief/detailed modes
  structured?: StructuredSummary; // structured mode
}

export const COMPARISON_CATEGORIES = [
  "Research Problem",
  "Methodology",
  "Dataset",
  "Model",
  "Evaluation",
  "Results",
  "Limitations",
] as const;

export interface ComparisonRow {
  category: (typeof COMPARISON_CATEGORIES)[number];
  values: string[]; // aligned with papers[] order
}

export interface ComparisonResult {
  papers: { id: string; title: string }[];
  rows: ComparisonRow[];
  narrative: string;
}

export interface AnalysisDocument {
  id: string;
  title: string;
  pages: { pageNumber: number; text: string }[];
}

export interface DocumentAnalysisService {
  readonly providerName: "gemini" | "demo";
  summarize(document: AnalysisDocument, mode: SummaryMode): Promise<SummaryResult>;
  compare(documents: AnalysisDocument[]): Promise<ComparisonResult>;
}
