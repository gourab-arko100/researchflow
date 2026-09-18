"use server";

import { getOrCreateCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getAIService, getEmbeddingService } from "@/lib/ai";
import { searchChunks } from "@/lib/ai/vector";
import { assertRateLimit } from "@/lib/rate-limit";
import type { AIAnswer } from "@/lib/ai/types";

const MAX_QUESTION_LENGTH = 2000;

export async function askAboutDocument(documentId: string, question: string): Promise<AIAnswer> {
  const user = await getOrCreateCurrentUser();
  if (!user) throw new Error("Not signed in");

  const trimmed = question.trim();
  if (!trimmed) throw new Error("Ask a question first");
  if (trimmed.length > MAX_QUESTION_LENGTH) throw new Error(`Keep questions under ${MAX_QUESTION_LENGTH} characters`);

  assertRateLimit(`ask:${user.id}`, 20, 5 * 60 * 1000);

  const document = await db.document.findFirst({
    where: { id: documentId, workspace: { ownerId: user.id } },
    select: { id: true, status: true },
  });
  if (!document) throw new Error("Document not found");
  if (document.status !== "READY") throw new Error("This document isn't fully indexed yet");

  const embeddingService = getEmbeddingService();
  const queryEmbedding = await embeddingService.embed(trimmed);

  const chunks = await searchChunks({
    documentIds: [documentId],
    queryEmbedding,
    limit: 6,
  });

  const aiService = getAIService();
  return aiService.generateAnswer(trimmed, chunks);
}
