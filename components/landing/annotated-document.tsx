export function AnnotatedDocument() {
  return (
    <div className="relative">
      <div className="rounded border border-hairline bg-paper-raised p-8 dark:border-hairline-dark dark:bg-paper-dark-raised">
        <p className="font-mono text-xs text-ink-faint dark:text-paper/40">Bengali Aphasia Detection Using Deep Learning</p>
        <div className="mt-4 space-y-2.5 font-serif text-sm leading-relaxed text-ink-soft dark:text-paper/60">
          <div className="h-2.5 w-[92%] rounded-sm bg-ink/[0.07] dark:bg-paper/10" />
          <div className="h-2.5 w-[97%] rounded-sm bg-ink/[0.07] dark:bg-paper/10" />
          <mark className="relative -mx-1 block rounded-sm bg-brass/20 px-1 py-1.5 text-ink no-underline decoration-transparent dark:bg-brass/25 dark:text-paper">
            <span className="block h-2.5 w-[88%] rounded-sm bg-brass/40 dark:bg-brass/50" />
          </mark>
          <div className="h-2.5 w-[95%] rounded-sm bg-ink/[0.07] dark:bg-paper/10" />
          <div className="h-2.5 w-[70%] rounded-sm bg-ink/[0.07] dark:bg-paper/10" />
        </div>
        <div className="mt-6 space-y-2.5 font-serif text-sm leading-relaxed">
          <div className="h-2.5 w-full rounded-sm bg-ink/[0.05] dark:bg-paper/[0.06]" />
          <div className="h-2.5 w-[85%] rounded-sm bg-ink/[0.05] dark:bg-paper/[0.06]" />
          <div className="h-2.5 w-[91%] rounded-sm bg-ink/[0.05] dark:bg-paper/[0.06]" />
        </div>
      </div>

      <div className="absolute -bottom-8 -right-6 w-64 rounded border border-hairline bg-paper-raised p-4 shadow-[0_8px_24px_-12px_rgba(20,23,28,0.25)] dark:border-hairline-dark dark:bg-paper-dark-raised sm:-right-10">
        <p className="font-sans text-xs leading-relaxed text-ink dark:text-paper">
          The model reaches 91.4% accuracy on the held-out Bengali speech set.
        </p>
        <p className="mt-2 font-mono text-[11px] text-teal dark:text-teal-muted">Source · Page 7</p>
      </div>
    </div>
  );
}
