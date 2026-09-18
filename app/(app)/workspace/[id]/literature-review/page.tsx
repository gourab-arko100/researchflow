import { notFound } from "next/navigation";
import Link from "next/link";
import { getOrCreateCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { LiteratureReviewView } from "@/components/analysis/literature-review-view";

export default async function LiteratureReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getOrCreateCurrentUser();
  if (!user) notFound();

  const workspace = await db.workspace.findFirst({
    where: { id, ownerId: user.id },
    include: { documents: { where: { status: "READY" }, orderBy: { createdAt: "desc" } } },
  });
  if (!workspace) notFound();

  return (
    <main className="container-page max-w-2xl py-16">
      <Link href={`/workspace/${id}`} className="font-mono text-xs text-ink-faint hover:text-ink dark:text-paper/40 dark:hover:text-paper">
        ← {workspace.name}
      </Link>
      <h1 className="mt-3 font-display text-3xl">Literature review</h1>
      <p className="mt-2 font-sans text-sm text-ink-soft dark:text-paper/70">
        Groups your papers into themes and drafts a synthesis for each — edit, regenerate, or export any section.
      </p>
      <div className="mt-8">
        <LiteratureReviewView documents={workspace.documents.map((d) => ({ id: d.id, title: d.title }))} />
      </div>
    </main>
  );
}
