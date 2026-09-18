const CATEGORY_KEYWORDS: Record<string, string[]> = {
  researchProblem: ["problem", "challenge", "motivat", "address", "propose"],
  methodology: ["method", "approach", "architecture", "model", "algorithm", "framework"],
  dataset: ["dataset", "corpus", "data set", "collected", "samples", "participants"],
  results: ["result", "accuracy", "performance", "achiev", "f1", "precision", "recall"],
  limitations: ["limitation", "however", "constraint", "shortcoming", "drawback"],
  futureWork: ["future work", "future research", "future direction", "remains to be"],
};

/** Finds the first sentence-ish window containing any of a category's
 * keywords, searched across all page text in order. Real extraction, not a
 * canned string — just shallow (keyword match, not semantic understanding). */
export function extractByKeywords(fullText: string, keywords: string[], windowChars = 400): string | null {
  const lower = fullText.toLowerCase();
  for (const keyword of keywords) {
    const idx = lower.indexOf(keyword);
    if (idx === -1) continue;
    const start = Math.max(0, idx - 60);
    const end = Math.min(fullText.length, idx + windowChars);
    const snippet = fullText.slice(start, end).trim();
    return (start > 0 ? "…" : "") + snippet + (end < fullText.length ? "…" : "");
  }
  return null;
}

export function extractOverview(pages: { text: string }[]): string {
  const firstPageText = pages[0]?.text ?? "";
  return firstPageText.slice(0, 500).trim() || "No text available.";
}

export function extractField(pages: { text: string }[], field: keyof typeof CATEGORY_KEYWORDS): string {
  const fullText = pages.map((p) => p.text).join("\n");
  return (
    extractByKeywords(fullText, CATEGORY_KEYWORDS[field]) ??
    "Not clearly identifiable from the extracted text with keyword matching alone."
  );
}
