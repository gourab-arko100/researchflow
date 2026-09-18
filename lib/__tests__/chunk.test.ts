import { describe, it, expect } from "vitest";
import { chunkPages } from "@/lib/ai/chunk";

describe("chunkPages", () => {
  it("keeps a short page as a single chunk", () => {
    const chunks = chunkPages([{ pageNumber: 1, text: "A short page of text." }]);
    expect(chunks).toHaveLength(1);
    expect(chunks[0]).toEqual({ pageNumber: 1, text: "A short page of text." });
  });

  it("splits a long page into multiple overlapping chunks, all tagged with the source page", () => {
    const longText = "word ".repeat(500).trim(); // well over the 1000-char chunk size
    const chunks = chunkPages([{ pageNumber: 3, text: longText }]);

    expect(chunks.length).toBeGreaterThan(1);
    for (const c of chunks) {
      expect(c.pageNumber).toBe(3);
      expect(c.text.length).toBeGreaterThan(0);
    }
  });

  it("never cuts a chunk mid-word", () => {
    const longText = "alpha bravo charlie delta echo foxtrot golf hotel india juliet kilo lima mike november oscar papa quebec romeo sierra tango uniform victor whiskey xray yankee zulu ".repeat(10);
    const chunks = chunkPages([{ pageNumber: 1, text: longText }]);

    for (const c of chunks) {
      expect(c.text.startsWith(" ")).toBe(false);
      expect(c.text.endsWith(" ")).toBe(false);
    }
  });

  it("skips empty or whitespace-only pages", () => {
    const chunks = chunkPages([
      { pageNumber: 1, text: "" },
      { pageNumber: 2, text: "   " },
      { pageNumber: 3, text: "Real content here." },
    ]);
    expect(chunks).toHaveLength(1);
    expect(chunks[0].pageNumber).toBe(3);
  });

  it("preserves page order across multiple pages", () => {
    const chunks = chunkPages([
      { pageNumber: 1, text: "Page one content." },
      { pageNumber: 2, text: "Page two content." },
    ]);
    expect(chunks.map((c) => c.pageNumber)).toEqual([1, 2]);
  });
});
