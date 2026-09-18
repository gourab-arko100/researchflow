import { notFound } from "next/navigation";
import Link from "next/link";
import { getOrCreateCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { ResearchGapsView } from "@/components/analysis/research-gaps-view";

export default async function ResearchGapsPage({ params }: { params: Promise<{ id: string }> }) {
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
      <h1 className="mt-3 font-display text-3xl">Research gaps</h1>
      <p className="mt-2 font-sans text-sm text-ink-soft dark:text-paper/70">
        AI-generated observations to help you spot underexplored angles — not established fact.
      </p>
      <div className="mt-8">
        <ResearchGapsView documents={workspace.documents.map((d) => ({ id: d.id, title: d.title }))} />
      </div>
    </main>
  );
}
