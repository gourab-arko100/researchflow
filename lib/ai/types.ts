export const EMBEDDING_DIMENSIONS = 768;

export interface EmbeddingService {
  readonly providerName: "gemini" | "demo";
  embed(text: string): Promise<number[]>;
  embedBatch(texts: string[]): Promise<number[][]>;
}

export interface RetrievedChunk {
  chunkId: string;
  documentId: string;
  documentTitle: string;
  pageNumber: number;
  text: string;
  distance: number; // lower = more similar (cosine distance)
}

export interface Citation {
  documentId: string;
  documentTitle: string;
  pageNumber: number;
}

export interface AIAnswer {
  answer: string;
  usedContext: boolean;
  citations: Citation[];
}

export interface AIService {
  readonly providerName: "gemini" | "demo";
  generateAnswer(question: string, chunks: RetrievedChunk[]): Promise<AIAnswer>;
}

export interface StructuredSummary {
  overview: string;
  researchProblem: string;
  methodology: string;
  dataset: string;
  results: string;
  limitations: string;
  futureWork: string;
}

export interface ComparisonInput {
  documentId: string;
  title: string;
  summary: StructuredSummary;
}

export interface DocumentAnalysisService {
  readonly providerName: "gemini" | "demo";
  summarize(fullText: string, title: string): Promise<StructuredSummary>;
  compare(papers: ComparisonInput[]): Promise<string>; // narrative comparison (Markdown)
  findResearchGaps(papers: ComparisonInput[]): Promise<string>; // Markdown, always UI-labeled as AI-generated
  generateLiteratureReview(papers: ComparisonInput[]): Promise<LitReviewTheme[]>;
  regenerateThemeText(theme: { title: string; papers: ComparisonInput[] }): Promise<string>;
}

export interface LitReviewTheme {
  title: string;
  paperIds: string[];
  text: string; // Markdown
}
