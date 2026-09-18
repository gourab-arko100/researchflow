import Link from "next/link";
import { UserButton } from "@clerk/nextjs";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/search", label: "Search" },
  { href: "/notes", label: "Notes" },
  { href: "/saved", label: "Saved" },
  { href: "/analytics", label: "Analytics" },
];

/**
 * Shared by every authenticated route (dashboard, workspace, document,
 * search, notes, saved, analytics) via the (app) route group — a route
 * group changes nothing about the URL, only which layout wraps it. Public
 * pages (landing, /demo, sign-in/up) sit outside this group and keep their
 * own separate nav, since a signed-out visitor showing UserButton or
 * "Dashboard" makes no sense there.
 *
 * This exists specifically so no page is ever a dead end — before this,
 * getting back to the dashboard from deep inside a document reader or a
 * chat thread meant clicking back through each page's single contextual
 * "← parent" link one at a time.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <header className="border-b border-hairline dark:border-hairline-dark">
        <div className="container-page flex h-14 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="font-display text-base tracking-tight">
              ResearchFlow
            </Link>
            <nav className="hidden items-center gap-5 sm:flex">
              {links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="font-mono text-xs text-ink-soft transition-colors hover:text-ink dark:text-paper/60 dark:hover:text-paper"
                >
                  {l.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="font-mono text-xs text-ink-faint hover:text-ink dark:text-paper/40 dark:hover:text-paper"
            >
              Home
            </Link>
            <UserButton appearance={{ elements: { avatarBox: "h-7 w-7" } }} />
          </div>
        </div>
        {/* Small screens: links collapse under the main row instead of hiding */}
        <nav className="container-page flex gap-4 overflow-x-auto pb-3 sm:hidden">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="shrink-0 font-mono text-xs text-ink-soft hover:text-ink dark:text-paper/60 dark:hover:text-paper"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </header>
      {children}
    </div>
  );
}
