export default function DashboardLoading() {
  return (
    <main className="container-page py-16">
      <div className="h-3 w-40 animate-pulse rounded-sm bg-ink/10 dark:bg-paper/10" />
      <div className="mt-3 h-9 w-64 animate-pulse rounded-sm bg-ink/10 dark:bg-paper/10" />
      <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded border border-hairline bg-ink/5 dark:border-hairline-dark dark:bg-paper/5" />
        ))}
      </div>
      <div className="mt-12 space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-14 animate-pulse rounded bg-ink/5 dark:bg-paper/5" />
        ))}
      </div>
    </main>
  );
}
