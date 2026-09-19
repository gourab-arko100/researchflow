import { notFound } from "next/navigation";
import Link from "next/link";
import { getDemoDocument } from "@/lib/actions/demo";
import { DemoDocumentView } from "@/components/demo/demo-document-view";

// Same reasoning as app/demo/page.tsx — must not be statically prerendered.
export const dynamic = "force-dynamic";

export default async function DemoDocumentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const document = await getDemoDocument(id);
  if (!document) notFound();

  return (
    <main className="container-page py-16">
      <Link href="/demo" className="font-mono text-xs text-ink-faint hover:text-ink dark:text-paper/40 dark:hover:text-paper">
        ← Demo workspace
      </Link>
      <div className="mt-6">
        <DemoDocumentView
          document={{
            id: document.id,
            title: document.title,
            authors: document.authors,
            year: document.year,
            abstract: document.abstract,
          }}
          pages={document.pages.map((p) => ({ pageNumber: p.pageNumber, text: p.text }))}
        />
      </div>
    </main>
  );
}
