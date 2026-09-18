export default function DocumentLoading() {
  return (
    <div className="grid min-h-[calc(100vh-4rem)] grid-cols-1 lg:grid-cols-[200px_1fr_280px]">
      <aside className="border-b border-hairline p-4 lg:border-b-0 lg:border-r dark:border-hairline-dark">
        <div className="space-y-1.5">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="h-6 animate-pulse rounded bg-ink/5 dark:bg-paper/5" />
          ))}
        </div>
      </aside>
      <main className="p-6 lg:p-10">
        <div className="h-4 w-40 animate-pulse rounded-sm bg-ink/10 dark:bg-paper/10" />
        <div className="mt-6 space-y-2.5">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-3 animate-pulse rounded-sm bg-ink/5 dark:bg-paper/5" style={{ width: `${85 - i * 4}%` }} />
          ))}
        </div>
      </main>
      <aside className="border-t border-hairline p-5 lg:border-l lg:border-t-0 dark:border-hairline-dark">
        <div className="h-24 animate-pulse rounded bg-ink/5 dark:bg-paper/5" />
      </aside>
    </div>
  );
}
