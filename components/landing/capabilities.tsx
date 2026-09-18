const groups = [
  {
    heading: "Understand one paper",
    body: "Upload a PDF and ResearchFlow extracts its structure — problem, method, dataset, results, limitations — so you can read the paper in minutes, not hours.",
    items: ["Structured summaries", "Ask about any selected passage", "Every claim cites a page"],
  },
  {
    heading: "Work across your library",
    body: "Select any set of papers and ask a question that spans them. Comparisons, shared limitations, and research gaps are generated from what's actually in your documents.",
    items: ["Side-by-side comparison tables", "Cross-paper Q&A", "AI-labelled research-gap analysis"],
  },
  {
    heading: "Write from what you've read",
    body: "Group papers into themes and generate a literature-review draft with references tied back to your uploads — edit, regenerate, or export section by section.",
    items: ["Themed literature reviews", "APA / IEEE / MLA citations", "Notes linked to a page"],
  },
];

export function Capabilities() {
  return (
    <section id="capabilities" className="border-t border-hairline py-14 dark:border-hairline-dark md:py-16">
      <div className="container-page">
        <h2 className="max-w-md font-display text-3xl font-medium tracking-tight">
          One workspace, from first read to written review.
        </h2>
        <div className="mt-10 grid gap-12 md:grid-cols-3 md:gap-8">
          {groups.map((g, i) => (
            <div key={g.heading} className={i > 0 ? "border-t border-hairline pt-8 dark:border-hairline-dark md:border-t-0 md:border-l md:pl-8 md:pt-0" : ""}>
              <h3 className="font-display text-xl">{g.heading}</h3>
              <p className="mt-3 font-sans text-sm leading-relaxed text-ink-soft dark:text-paper/70">{g.body}</p>
              <ul className="mt-5 space-y-2">
                {g.items.map((item) => (
                  <li key={item} className="flex items-baseline gap-2 font-sans text-sm text-ink dark:text-paper/90">
                    <span className="font-mono text-xs text-brass">·</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
