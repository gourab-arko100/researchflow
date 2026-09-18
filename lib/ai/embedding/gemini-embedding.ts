import { GoogleGenAI } from "@google/genai";
import { EMBEDDING_DIMENSIONS, type EmbeddingService } from "@/lib/ai/types";
import { withGeminiRetry } from "@/lib/ai/retry";

export class GeminiEmbeddingService implements EmbeddingService {
  readonly providerName = "gemini" as const;
  private client: GoogleGenAI;

  constructor(apiKey: string) {
    this.client = new GoogleGenAI({ apiKey });
  }

  async embed(text: string): Promise<number[]> {
    const [result] = await this.embedBatch([text]);
    return result;
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return [];

    const response = await withGeminiRetry(() =>
      this.client.models.embedContent({
        model: "gemini-embedding-001",
        contents: texts,
        config: { outputDimensionality: EMBEDDING_DIMENSIONS },
      })
    );

    if (!response.embeddings) throw new Error("Gemini returned no embeddings");
    return response.embeddings.map((e) => e.values ?? []);
  }
}
