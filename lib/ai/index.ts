import type { AIService, EmbeddingService, DocumentAnalysisService } from "@/lib/ai/types";
import { GeminiEmbeddingService } from "@/lib/ai/embedding/gemini-embedding";
import { DemoEmbeddingService } from "@/lib/ai/embedding/demo-embedding";
import { GeminiAIService } from "@/lib/ai/providers/gemini";
import { DemoAIService } from "@/lib/ai/providers/demo";
import { GeminiDocumentAnalysisService } from "@/lib/ai/analysis/gemini-analysis";
import { DemoDocumentAnalysisService } from "@/lib/ai/analysis/demo-analysis";

let embeddingService: EmbeddingService | null = null;
let aiService: AIService | null = null;
let analysisService: DocumentAnalysisService | null = null;

export function getEmbeddingService(): EmbeddingService {
  if (embeddingService) return embeddingService;
  const apiKey = process.env.GEMINI_API_KEY;
  embeddingService = apiKey ? new GeminiEmbeddingService(apiKey) : new DemoEmbeddingService();
  return embeddingService;
}

export function getAIService(): AIService {
  if (aiService) return aiService;
  const apiKey = process.env.GEMINI_API_KEY;
  aiService = apiKey ? new GeminiAIService(apiKey) : new DemoAIService();
  return aiService;
}

export function getDocumentAnalysisService(): DocumentAnalysisService {
  if (analysisService) return analysisService;
  const apiKey = process.env.GEMINI_API_KEY;
  analysisService = apiKey ? new GeminiDocumentAnalysisService(apiKey) : new DemoDocumentAnalysisService();
  return analysisService;
}

export type {
  AIAnswer,
  AIService,
  Citation,
  ComparisonInput,
  DocumentAnalysisService,
  EmbeddingService,
  LitReviewTheme,
  RetrievedChunk,
  StructuredSummary,
} from "@/lib/ai/types";
