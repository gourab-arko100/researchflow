import { notFound } from "next/navigation";
import Link from "next/link";
import { getOrCreateCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { ComparisonView } from "@/components/compare/comparison-view";

export default async function ComparePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getOrCreateCurrentUser();
  if (!user) notFound();

  const workspace = await db.workspace.findFirst({
    where: { id, ownerId: user.id },
    include: { documents: { where: { status: "READY" }, orderBy: { createdAt: "desc" } } },
  });
  if (!workspace) notFound();

  return (
    <main className="container-page py-16">
      <Link href={`/workspace/${id}`} className="font-mono text-xs text-ink-faint hover:text-ink dark:text-paper/40 dark:hover:text-paper">
        ← {workspace.name}
      </Link>
      <h1 className="mt-3 font-display text-3xl">Compare papers</h1>
      <div className="mt-8">
        <ComparisonView documents={workspace.documents.map((d) => ({ id: d.id, title: d.title }))} />
      </div>
    </main>
  );
}
