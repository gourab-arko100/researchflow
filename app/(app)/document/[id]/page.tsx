import { notFound } from "next/navigation";
import { getOrCreateCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { DocumentReader } from "@/components/reader/document-reader";
import { StatusBadge } from "@/components/ui/badge";
import Link from "next/link";

export default async function DocumentPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { id } = await params;
  const { page } = await searchParams;
  const user = await getOrCreateCurrentUser();
  if (!user) notFound();

  const document = await db.document.findFirst({
    where: { id, workspace: { ownerId: user.id } },
    include: {
      workspace: { select: { id: true, name: true } },
      pages: { orderBy: { pageNumber: "asc" } },
    },
  });
  if (!document) notFound();

  const notes = await db.note.findMany({
    where: { documentId: id, userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  if (document.pages.length === 0) {
    return (
      <main className="container-page py-16">
        <Link href={`/workspace/${document.workspace.id}`} className="font-mono text-xs text-ink-faint hover:text-ink dark:text-paper/40 dark:hover:text-paper">
          ← {document.workspace.name}
        </Link>
        <h1 className="mt-3 font-display text-3xl">{document.title}</h1>
        <div className="mt-4">
          <StatusBadge status={document.status} />
        </div>
        <p className="mt-4 max-w-md font-sans text-sm text-ink-soft dark:text-paper/70">
          {document.status === "FAILED"
            ? document.processingError ?? "Processing failed."
            : "Still extracting text — refresh in a moment."}
        </p>
      </main>
    );
  }

  return (
    <DocumentReader
      document={{
        id: document.id,
        title: document.title,
        fileName: document.fileName,
        fileSizeBytes: document.fileSizeBytes,
        status: document.status,
        pageCount: document.pageCount,
        createdAt: document.createdAt.toISOString(),
        workspaceId: document.workspace.id,
        workspaceName: document.workspace.name,
      }}
      pages={document.pages.map((p) => ({ pageNumber: p.pageNumber, text: p.text }))}
      initialPage={page ? Number(page) : undefined}
      initialNotes={notes.map((n) => ({ id: n.id, content: n.content, pageNumber: n.pageNumber, tags: n.tags, createdAt: n.createdAt.toISOString() }))}
    />
  );
}
