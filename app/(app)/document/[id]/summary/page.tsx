import { notFound } from "next/navigation";
import Link from "next/link";
import { getOrCreateCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { SummaryPanel } from "@/components/analysis/summary-panel";
import { StatusBadge } from "@/components/ui/badge";

export default async function DocumentSummaryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getOrCreateCurrentUser();
  if (!user) notFound();

  const document = await db.document.findFirst({
    where: { id, workspace: { ownerId: user.id } },
    include: { workspace: { select: { id: true, name: true } } },
  });
  if (!document) notFound();

  const hasCached = Boolean(document.researchProblem || document.methodology || document.results);

  return (
    <main className="container-page max-w-2xl py-16">
      <Link href={`/document/${id}`} className="font-mono text-xs text-ink-faint hover:text-ink dark:text-paper/40 dark:hover:text-paper">
        ← {document.title}
      </Link>
      <div className="mt-3 flex items-center gap-3">
        <h1 className="font-display text-2xl">Summary</h1>
        <StatusBadge status={document.status} />
      </div>

      {document.status !== "READY" ? (
        <p className="mt-4 font-sans text-sm text-ink-soft dark:text-paper/70">
          This document needs to finish indexing before it can be summarized.
        </p>
      ) : (
        <div className="mt-6">
          <SummaryPanel
            documentId={id}
            initialSummary={
              hasCached
                ? {
                    overview: document.abstract ?? "",
                    researchProblem: document.researchProblem ?? "",
                    methodology: document.methodology ?? "",
                    dataset: document.dataset ?? "",
                    results: document.results ?? "",
                    limitations: document.limitations ?? "",
                    futureWork: "",
                  }
                : null
            }
          />
        </div>
      )}
    </main>
  );
}
