const steps = [
  "Upload",
  "Chunk by page",
  "Embed",
  "Store in pgvector",
  "Retrieve on query",
  "Generate",
  "Cite the page",
];

export function ArchitectureStrip() {
  return (
    <section id="architecture" className="border-t border-hairline py-14 dark:border-hairline-dark md:py-16">
      <div className="container-page">
        <h2 className="max-w-md font-display text-3xl font-medium tracking-tight">
          Answers are retrieved, not guessed.
        </h2>
        <p className="mt-4 max-w-lg font-sans text-sm leading-relaxed text-ink-soft dark:text-paper/70">
          Every question runs through retrieval-augmented generation. The model only answers
          from chunks pulled out of your own documents — and says so when your library doesn't
          contain the answer.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-x-3 gap-y-4 font-mono text-xs">
          {steps.map((step, i) => (
            <div key={step} className="flex items-center gap-3">
              <span className="rounded-sm border border-hairline px-2.5 py-1.5 text-ink dark:border-hairline-dark dark:text-paper">
                {step}
              </span>
              {i < steps.length - 1 && <span className="text-ink-faint dark:text-paper/30">→</span>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
