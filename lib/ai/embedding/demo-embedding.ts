import { EMBEDDING_DIMENSIONS, type EmbeddingService } from "@/lib/ai/types";

/**
 * A hashing-trick bag-of-words vectorizer: each token hashes into one of
 * EMBEDDING_DIMENSIONS buckets, weighted by term frequency, then L2-normalized.
 * This is a real (if crude, lexical-only) embedding — cosine similarity between
 * two of these vectors reflects actual word overlap — not a stub that returns
 * a constant or random vector. It's what lets Demo mode retrieve real,
 * relevant passages with zero API key.
 */
export class DemoEmbeddingService implements EmbeddingService {
  readonly providerName = "demo" as const;

  async embed(text: string): Promise<number[]> {
    return hashEmbed(text);
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    return texts.map(hashEmbed);
  }
}

function hashEmbed(text: string): number[] {
  const vector = new Array(EMBEDDING_DIMENSIONS).fill(0);
  const tokens = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2);

  for (const token of tokens) {
    const bucket = fnv1a(token) % EMBEDDING_DIMENSIONS;
    vector[bucket] += 1;
    // also hash bigrams into a second bucket for a little more signal
    const bigram = token.slice(0, 4);
    vector[fnv1a(bigram + "#2") % EMBEDDING_DIMENSIONS] += 0.5;
  }

  const norm = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0)) || 1;
  return vector.map((v) => v / norm);
}

function fnv1a(str: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return Math.abs(hash);
}
