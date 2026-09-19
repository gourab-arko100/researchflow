import Link from "next/link";
import { getDemoWorkspace } from "@/lib/actions/demo";
import { DemoChat } from "@/components/demo/demo-chat";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Must be dynamic, not statically prerendered: this page hits the live
// database on every load (checking whether the demo workspace exists yet,
// self-seeding if not), which has no meaningful behavior at build time.
export const dynamic = "force-dynamic";
// Public, unauthenticated — seeds itself on first visit (see lib/demo/seed.ts)
// and runs entirely on the Demo providers, never touching GEMINI_API_KEY.
export default async function DemoPage() {
  const workspace = await getDemoWorkspace();

  return (
    <main className="container-page py-16">
      <div className="rounded border border-brass/30 bg-brass/5 px-4 py-3">
        <p className="font-sans text-sm text-ink dark:text-paper">
          You're viewing a shared demo workspace with synthetic sample papers — no account or API key needed.{" "}
          <Link href="/sign-up" className="text-teal underline dark:text-teal-muted">
            Sign up
          </Link>{" "}
          to build your own.
        </p>
      </div>

      <h1 className="mt-8 font-display text-3xl">{workspace.name}</h1>
      <p className="mt-2 max-w-lg font-sans text-sm text-ink-soft dark:text-paper/70">{workspace.description}</p>

      <div className="mt-10">
        <DemoChat documentIds={workspace.documents.map((d) => d.id)} />
      </div>

      <div className="mt-10">
        <h2 className="font-display text-lg">Papers in this workspace</h2>
        <ul className="mt-4 divide-y divide-hairline border-t border-hairline dark:divide-hairline-dark dark:border-hairline-dark">
          {workspace.documents.map((doc) => (
            <li key={doc.id}>
              <Link href={`/demo/document/${doc.id}`} className="block py-4 hover:opacity-70">
                <p className="font-display text-base">{doc.title}</p>
                <p className="mt-1 font-mono text-xs text-ink-faint dark:text-paper/40">
                  {doc.authors.join(", ")}
                  {doc.year ? ` · ${doc.year}` : ""} · {doc.pageCount} pages
                </p>
                {doc.abstract && (
                  <p className="mt-2 max-w-2xl font-sans text-sm text-ink-soft dark:text-paper/70">
                    {doc.abstract.length > 220 ? doc.abstract.slice(0, 220) + "…" : doc.abstract}
                  </p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <Link href="/" className={cn(buttonVariants({ variant: "outline" }), "mt-10")}>
        Back home
      </Link>
    </main>
  );
}
