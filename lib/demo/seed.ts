import { db } from "@/lib/db";
import { DEMO_PAPERS } from "@/lib/demo/seed-data";
import { DemoEmbeddingService } from "@/lib/ai/embedding/demo-embedding";
import { chunkPages } from "@/lib/ai/chunk";
import { insertChunkEmbeddings } from "@/lib/ai/vector";

// Fixed ids double as an idempotency check — if this workspace already
// exists, seeding is skipped. A real Postgres unique constraint (the @id)
// prevents a race between two simultaneous first-visitors from double-seeding.
export const DEMO_WORKSPACE_ID = "demo-system-workspace";
export const DEMO_USER_ID = "demo-system-user";

/** Seeds the public demo workspace on first access, if it doesn't exist yet.
 * Always uses the Demo embedding/AI providers directly (not the env-based
 * factories in lib/ai/index.ts) — the public demo must never depend on
 * GEMINI_API_KEY, even on a deployment where the owner has configured one
 * for their own authenticated use. */
export async function ensureDemoWorkspace(): Promise<void> {
  const existing = await db.workspace.findUnique({ where: { id: DEMO_WORKSPACE_ID }, select: { id: true } });
  if (existing) return;

  await db.user.upsert({
    where: { id: DEMO_USER_ID },
    create: { id: DEMO_USER_ID, email: "demo@researchflow.app", name: "Demo", settings: { create: {} } },
    update: {},
  });

  try {
    await db.workspace.create({
      data: {
        id: DEMO_WORKSPACE_ID,
        name: "ResearchFlow Demo",
        description: "Synthetic sample papers — explore without an account or API key.",
        ownerId: DEMO_USER_ID,
      },
    });
  } catch {
    // Another request won the race and already created it — fine, fall through
    // to a no-op below since the documents loop is also guarded by upsert-like
    // behavior (each iteration only runs once per unseeded workspace anyway).
    return;
  }

  const embeddingService = new DemoEmbeddingService();

  for (const paper of DEMO_PAPERS) {
    const document = await db.document.create({
      data: {
        workspaceId: DEMO_WORKSPACE_ID,
        title: paper.title,
        authors: paper.authors,
        year: paper.year,
        abstract: paper.abstract,
        keywords: paper.keywords,
        fileUrl: `demo://${paper.slug}`, // no real upload — seeded directly, not run through the upload pipeline
        fileName: `${paper.slug}.pdf`,
        fileSizeBytes: 0,
        status: "PROCESSING",
      },
    });

    await db.documentPage.createMany({
      data: paper.pages.map((text, i) => ({ documentId: document.id, pageNumber: i + 1, text })),
    });

    const chunks = chunkPages(paper.pages.map((text, i) => ({ pageNumber: i + 1, text })));
    const embeddings = await embeddingService.embedBatch(chunks.map((c) => c.text));
    if (embeddings.length !== chunks.length) {
      throw new Error(`Embedding count (${embeddings.length}) didn't match chunk count (${chunks.length})`);
    }
    await insertChunkEmbeddings(
      document.id,
      chunks.map((c, i) => ({ pageNumber: c.pageNumber, text: c.text, embedding: embeddings[i]! }))
    );

    await db.document.update({
      where: { id: document.id },
      data: { status: "READY", pageCount: paper.pages.length },
    });
  }
}
