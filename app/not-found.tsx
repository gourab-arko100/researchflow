import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <main className="container-page flex min-h-[70vh] flex-col items-center justify-center text-center">
      <p className="font-mono text-xs text-ink-faint dark:text-paper/40">404</p>
      <h1 className="mt-3 font-display text-2xl">Nothing here</h1>
      <p className="mt-2 max-w-md font-sans text-sm text-ink-soft dark:text-paper/70">
        This page doesn't exist, or you don't have access to it — the same message either way, so no one can probe
        for what's private.
      </p>
      <Link href="/dashboard" className={cn(buttonVariants({ variant: "primary" }), "mt-6")}>
        Dashboard
      </Link>
    </main>
  );
}
