"use client";

import Link from "next/link";
import { useEffect } from "react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Server-side details (stack traces, DB errors) stay in the server logs —
    // this is deliberately generic for the person looking at the screen,
    // per the spec's "don't expose raw server errors" guidance.
    console.error(error);
  }, [error]);

  return (
    <main className="container-page flex min-h-[70vh] flex-col items-center justify-center text-center">
      <p className="font-mono text-xs text-red-700 dark:text-red-400">Something went wrong</p>
      <h1 className="mt-3 font-display text-2xl">This page hit an error</h1>
      <p className="mt-2 max-w-md font-sans text-sm text-ink-soft dark:text-paper/70">
        Nothing was lost. Try again, or head back to your dashboard.
      </p>
      <div className="mt-6 flex gap-3">
        <button onClick={reset} className={cn(buttonVariants({ variant: "primary" }))}>
          Try again
        </button>
        <Link href="/dashboard" className={cn(buttonVariants({ variant: "outline" }))}>
          Dashboard
        </Link>
      </div>
    </main>
  );
}
