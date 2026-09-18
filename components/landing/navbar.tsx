import Link from "next/link";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { buttonVariants } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { cn } from "@/lib/utils";

const links = [
  { href: "#capabilities", label: "Capabilities" },
  { href: "#architecture", label: "Architecture" },
  { href: "/demo", label: "Demo" },
];

export function Navbar() {
  return (
    <header className="border-b border-hairline dark:border-hairline-dark">
      <div className="container-page flex h-16 items-center justify-between">
        <Link href="/" className="font-display text-lg tracking-tight">
          ResearchFlow
        </Link>
        <nav className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="font-sans text-sm text-ink-soft transition-colors hover:text-ink dark:text-paper/70 dark:hover:text-paper"
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <SignedOut>
            <Link href="/sign-in" className="hidden font-sans text-sm text-ink-soft hover:text-ink sm:inline dark:text-paper/70 dark:hover:text-paper">
              Sign in
            </Link>
            <Link href="/demo" className={cn(buttonVariants({ variant: "primary", size: "sm" }))}>
              Explore demo
            </Link>
          </SignedOut>
          <SignedIn>
            <Link href="/dashboard" className="hidden font-sans text-sm text-ink-soft hover:text-ink sm:inline dark:text-paper/70 dark:hover:text-paper">
              Dashboard
            </Link>
            <UserButton
              appearance={{
                elements: { avatarBox: "h-8 w-8" },
              }}
            />
          </SignedIn>
        </div>
      </div>
    </header>
  );
}
