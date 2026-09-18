import { GoogleGenAI } from "@google/genai";
import type { AIAnswer, AIService, Citation, RetrievedChunk } from "@/lib/ai/types";
import { withGeminiRetry } from "@/lib/ai/retry";

const NO_CONTEXT_ANSWER =
  "The documents in this workspace don't provide enough information to answer that.";

export class GeminiAIService implements AIService {
  readonly providerName = "gemini" as const;
  private client: GoogleGenAI;

  constructor(apiKey: string) {
    this.client = new GoogleGenAI({ apiKey });
  }

  async generateAnswer(question: string, chunks: RetrievedChunk[]): Promise<AIAnswer> {
    // Cost control: don't call the model at all when there's nothing to
    // ground an answer in — this is a deterministic branch, not an AI call.
    if (chunks.length === 0) {
      return { answer: NO_CONTEXT_ANSWER, usedContext: false, citations: [] };
    }

    const context = chunks
      .map((c, i) => `[Source ${i + 1} — ${c.documentTitle}, Page ${c.pageNumber}]\n${c.text}`)
      .join("\n\n");

    const prompt = `You are a research assistant. Answer the question using ONLY the research context below. When you use a source, cite it inline using exactly the format [Source N] (e.g. [Source 1], [Source 2]) — do not invent a different citation format. If the context does not contain enough information to answer, say so plainly instead of guessing.

Research context:
${context}

Question: ${question}

Answer:`;

    const response = await withGeminiRetry(() =>
      this.client.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
      })
    );

    const rawAnswer = response.text?.trim() || NO_CONTEXT_ANSWER;

    // Parse the model's own [Source N] tags — reliable even across multiple
    // papers that happen to share page numbers, unlike matching "page N" in
    // free text. Falls back to citing every retrieved source if the model
    // didn't tag anything (still grounded — just not attributed per-sentence).
    const citedIndices = new Set(
      [...rawAnswer.matchAll(/\[Source (\d+)\]/g)]
        .map((m) => Number(m[1]) - 1)
        .filter((i) => i >= 0 && i < chunks.length)
    );
    const citedChunks = citedIndices.size > 0 ? [...citedIndices].map((i) => chunks[i]) : chunks;

    // Replace [Source N] with a human-readable "[Title, p. N]" label for display.
    const answer = rawAnswer.replace(/\[Source (\d+)\]/g, (match, numStr: string) => {
      const chunk = chunks[Number(numStr) - 1];
      return chunk ? `[${chunk.documentTitle}, p. ${chunk.pageNumber}]` : match;
    });

    return {
      answer,
      usedContext: true,
      citations: dedupeCitations(citedChunks),
    };
  }
}

function dedupeCitations(chunks: RetrievedChunk[]): Citation[] {
  const seen = new Set<string>();
  const citations: Citation[] = [];
  for (const c of chunks) {
    const key = `${c.documentId}:${c.pageNumber}`;
    if (seen.has(key)) continue;
    seen.add(key);
    citations.push({ documentId: c.documentId, documentTitle: c.documentTitle, pageNumber: c.pageNumber });
  }
  return citations;
}
