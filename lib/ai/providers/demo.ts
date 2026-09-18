import type { AIAnswer, AIService, RetrievedChunk } from "@/lib/ai/types";

const NO_CONTEXT_ANSWER =
  "The documents in this workspace don't provide enough information to answer that.";

const RELEVANCE_THRESHOLD = 0.98; // cosine distance — above this, treat as "not found"

/**
 * No LLM call — this provider works with zero API key. It still does real
 * retrieval (see lib/ai/vector.ts) and returns the actual best-matching
 * passages rather than a canned response; it just doesn't paraphrase them
 * with a generative model. That's a genuine trade-off, not a mocked stub —
 * see README for why this is the honest way to make Demo mode functional.
 */
export class DemoAIService implements AIService {
  readonly providerName = "demo" as const;

  async generateAnswer(question: string, chunks: RetrievedChunk[]): Promise<AIAnswer> {
    const relevant = chunks.filter((c) => c.distance < RELEVANCE_THRESHOLD);

    if (relevant.length === 0) {
      return { answer: NO_CONTEXT_ANSWER, usedContext: false, citations: [] };
    }

    const top = relevant.slice(0, 3);
    const excerpts = top
      .map((c, i) => `${i + 1}. From "${c.documentTitle}" (Page ${c.pageNumber}):\n"${excerpt(c.text)}"`)
      .join("\n\n");

    const answer = `Demo mode retrieves the most relevant passages from your documents rather than generating a written answer (that needs a Gemini API key — see README). Here's what matched "${question}":\n\n${excerpts}`;

    return {
      answer,
      usedContext: true,
      citations: top.map((c) => ({ documentId: c.documentId, documentTitle: c.documentTitle, pageNumber: c.pageNumber })),
    };
  }
}

function excerpt(text: string, maxLength = 320): string {
  const trimmed = text.trim();
  if (trimmed.length <= maxLength) return trimmed;
  return trimmed.slice(0, maxLength).replace(/\s+\S*$/, "") + "…";
}
