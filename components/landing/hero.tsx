import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AnnotatedDocument } from "@/components/landing/annotated-document";

export function Hero() {
  return (
    <section className="container-page grid min-h-[calc(100vh-4rem)] items-center gap-16 py-20 md:grid-cols-[1.1fr_1fr] md:py-28">
      <div className="animate-reveal">
        <h1 className="max-w-lg font-display text-4xl font-medium leading-[1.1] tracking-tight md:text-5xl">
          Turn research papers into actionable knowledge.
        </h1>
        <p className="mt-6 max-w-sm font-sans text-lg text-ink-soft dark:text-paper/70">
          Read, analyze, compare, and understand your research library with AI-powered
          tools grounded in your own documents — every answer traces back to a page.
        </p>
        <div className="mt-9 flex flex-wrap items-center gap-4">
          <Link href="/sign-up" className={cn(buttonVariants({ variant: "primary", size: "lg" }))}>
            Start researching
          </Link>
          <Link href="/demo" className={cn(buttonVariants({ variant: "outline", size: "lg" }))}>
            Explore demo
          </Link>
        </div>
        <p className="mt-4 font-mono text-xs text-ink-faint dark:text-paper/40">
          No account needed for the demo workspace
        </p>
      </div>
      <div className="animate-reveal [animation-delay:150ms] [animation-fill-mode:backwards]">
        <AnnotatedDocument />
      </div>
    </section>
  );
}
