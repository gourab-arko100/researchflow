import { describe, it, expect } from "vitest";
import { DemoEmbeddingService } from "@/lib/ai/embedding/demo-embedding";
import { EMBEDDING_DIMENSIONS } from "@/lib/ai/types";

describe("DemoEmbeddingService", () => {
  const service = new DemoEmbeddingService();

  it("produces a vector of the expected dimensionality", async () => {
    const embedding = await service.embed("some research text about speech recognition");
    expect(embedding).toHaveLength(EMBEDDING_DIMENSIONS);
  });

  it("is deterministic — the same text always produces the same vector", async () => {
    const a = await service.embed("Bengali aphasia detection using deep learning");
    const b = await service.embed("Bengali aphasia detection using deep learning");
    expect(a).toEqual(b);
  });

  it("produces a unit-normalized (or zero) vector", async () => {
    const embedding = await service.embed("normalization check text with several words");
    const magnitude = Math.sqrt(embedding.reduce((sum, v) => sum + v * v, 0));
    expect(magnitude).toBeGreaterThan(0.99);
    expect(magnitude).toBeLessThan(1.01);
  });

  it("gives different vectors to genuinely different text", async () => {
    const a = await service.embed("transformer architectures for speech recognition");
    const b = await service.embed("completely unrelated content about tomato farming");
    expect(a).not.toEqual(b);
  });

  it("gives more similar vectors to texts sharing vocabulary than to unrelated text", async () => {
    const cosine = (a: number[], b: number[]) => a.reduce((sum, v, i) => sum + v * b[i], 0);

    const base = await service.embed("speech recognition dataset methodology results");
    const related = await service.embed("speech recognition methodology and dataset details");
    const unrelated = await service.embed("gardening tips for growing tomatoes in clay soil");

    expect(cosine(base, related)).toBeGreaterThan(cosine(base, unrelated));
  });

  it("embedBatch matches individual embed() calls, in order", async () => {
    const texts = ["first paper text", "second paper text", "third paper text"];
    const batch = await service.embedBatch(texts);
    const individual = await Promise.all(texts.map((t) => service.embed(t)));
    expect(batch).toEqual(individual);
  });

  it("returns an empty array for an empty batch", async () => {
    expect(await service.embedBatch([])).toEqual([]);
  });
});
