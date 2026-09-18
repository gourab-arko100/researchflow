import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-hairline py-10 dark:border-hairline-dark">
      <div className="container-page flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <p className="font-mono text-xs text-ink-faint dark:text-paper/40">ResearchFlow — built for effortless research</p>
        <div className="flex gap-6">
          <Link href="/demo" className="font-sans text-sm text-ink-soft hover:text-ink dark:text-paper/70 dark:hover:text-paper">
            Demo
          </Link>
          <Link href="https://github.com" className="font-sans text-sm text-ink-soft hover:text-ink dark:text-paper/70 dark:hover:text-paper">
            Source
          </Link>
        </div>
      </div>
    </footer>
  );
}
