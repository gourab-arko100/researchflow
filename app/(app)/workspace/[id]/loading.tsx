export default function WorkspaceLoading() {
  return (
    <main className="container-page py-16">
      <div className="h-3 w-24 animate-pulse rounded-sm bg-ink/10 dark:bg-paper/10" />
      <div className="mt-3 h-9 w-72 animate-pulse rounded-sm bg-ink/10 dark:bg-paper/10" />
      <div className="mt-10 h-32 animate-pulse rounded border border-dashed border-hairline dark:border-hairline-dark" />
      <div className="mt-8 space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-14 animate-pulse rounded bg-ink/5 dark:bg-paper/5" />
        ))}
      </div>
    </main>
  );
}
