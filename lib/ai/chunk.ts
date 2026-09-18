export type Chunk = { pageNumber: number; text: string };

const CHUNK_SIZE = 1000;
const CHUNK_OVERLAP = 150;

/** Splits each page's text into overlapping chunks, tagging each with the
 * page it came from — this is what makes "[Page N]" citations possible. */
export function chunkPages(pages: { pageNumber: number; text: string }[]): Chunk[] {
  const chunks: Chunk[] = [];

  for (const page of pages) {
    const text = page.text.trim();
    if (!text) continue;

    if (text.length <= CHUNK_SIZE) {
      chunks.push({ pageNumber: page.pageNumber, text });
      continue;
    }

    let start = 0;
    while (start < text.length) {
      let end = Math.min(start + CHUNK_SIZE, text.length);
      // avoid cutting mid-word
      if (end < text.length) {
        const lastSpace = text.lastIndexOf(" ", end);
        if (lastSpace > start) end = lastSpace;
      }
      const slice = text.slice(start, end).trim();
      if (slice) chunks.push({ pageNumber: page.pageNumber, text: slice });
      if (end >= text.length) break;
      start = end - CHUNK_OVERLAP;
    }
  }

  return chunks;
}
