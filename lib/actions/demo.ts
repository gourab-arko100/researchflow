"use server";

import { db } from "@/lib/db";
import { DemoEmbeddingService } from "@/lib/ai/embedding/demo-embedding";
import { DemoAIService } from "@/lib/ai/providers/demo";
import { searchChunks } from "@/lib/ai/vector";
import { ensureDemoWorkspace, DEMO_WORKSPACE_ID } from "@/lib/demo/seed";
import { assertRateLimit, getClientIp } from "@/lib/rate-limit";
import type { AIAnswer } from "@/lib/ai/types";
import { assertId, assertIdList, assertText } from "@/lib/validations";

// No auth check anywhere in this file — these are the only server actions in
// the app that intentionally run for signed-out visitors. Every query below
// is hard-scoped to DEMO_WORKSPACE_ID specifically so this can't become a
// backdoor into any real user's private documents.

export async function getDemoWorkspace() {
  await ensureDemoWorkspace();
  return db.workspace.findUniqueOrThrow({
    where: { id: DEMO_WORKSPACE_ID },
    include: { documents: { orderBy: { createdAt: "asc" } } },
  });
}

export async function getDemoDocument(documentId: string) {
  assertId(documentId, "document");
  await ensureDemoWorkspace();
  return db.document.findFirst({
    where: { id: documentId, workspaceId: DEMO_WORKSPACE_ID },
    include: { pages: { orderBy: { pageNumber: "asc" } } },
  });
}

export async function askDemoQuestion(documentIds: string[], question: string): Promise<AIAnswer> {
  const trimmed = assertText(question, 2000, "question");
  documentIds = assertIdList(documentIds, 10, "papers");

  // Rate-limit before touching the database at all.
  const ipForLimit = await getClientIp();
  await assertRateLimit(`demo:${ipForLimit}`, 20, 5 * 60 * 1000);

  await ensureDemoWorkspace();

  // IP-based since there's no user account here — this is the one public,
  // unauthenticated entry point in the app, and it's cheap (Demo providers,
  // no real API cost) but still worth capping against abuse of the DB.

  const validDocs = await db.document.findMany({
    where: { id: { in: documentIds }, workspaceId: DEMO_WORKSPACE_ID },
    select: { id: true },
  });
  if (validDocs.length === 0) throw new Error("No demo papers selected");

  // Always the Demo providers — this endpoint must work with zero API keys
  // configured anywhere, regardless of what the deployer has set up for
  // their own authenticated use.
  const embeddingService = new DemoEmbeddingService();
  const aiService = new DemoAIService();

  const queryEmbedding = await embeddingService.embed(trimmed);
  const chunks = await searchChunks({ documentIds: validDocs.map((d) => d.id), queryEmbedding, limit: 6 });

  return aiService.generateAnswer(trimmed, chunks);
}
