"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getOrCreateCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getAIService, getEmbeddingService } from "@/lib/ai";
import { searchChunks } from "@/lib/ai/vector";
import { assertRateLimit } from "@/lib/rate-limit";
import type { AIAnswer } from "@/lib/ai/types";

const MAX_MESSAGE_LENGTH = 4000;

export async function createConversation(workspaceId: string, documentIds: string[]) {
  const user = await getOrCreateCurrentUser();
  if (!user) redirect("/sign-in");

  if (documentIds.length === 0) {
    return { error: "Select at least one paper to chat with" };
  }

  const workspace = await db.workspace.findFirst({
    where: { id: workspaceId, ownerId: user.id },
    select: { id: true },
  });
  if (!workspace) return { error: "Workspace not found" };

  // Only papers that actually belong to this workspace and are indexed can be selected.
  const validDocs = await db.document.findMany({
    where: { id: { in: documentIds }, workspaceId: workspace.id, status: "READY" },
    select: { id: true },
  });
  if (validDocs.length === 0) return { error: "None of the selected papers are ready yet" };

  const conversation = await db.conversation.create({
    data: { workspaceId: workspace.id, documentIds: validDocs.map((d) => d.id) },
  });

  redirect(`/workspace/${workspaceId}/chat/${conversation.id}`);
}

export async function sendMessage(
  conversationId: string,
  content: string
): Promise<AIAnswer & { messageId: string }> {
  const user = await getOrCreateCurrentUser();
  if (!user) throw new Error("Not signed in");

  const trimmed = content.trim();
  if (!trimmed) throw new Error("Message is empty");
  if (trimmed.length > MAX_MESSAGE_LENGTH) throw new Error(`Keep messages under ${MAX_MESSAGE_LENGTH} characters`);

  assertRateLimit(`chat:${user.id}`, 20, 5 * 60 * 1000); // 20 messages / 5 min

  const conversation = await db.conversation.findFirst({
    where: { id: conversationId, workspace: { ownerId: user.id } },
  });
  if (!conversation) throw new Error("Conversation not found");

  await db.message.create({
    data: { conversationId, role: "user", content: trimmed },
  });

  // Give the conversation a title from its first message, for the sidebar list.
  if (!conversation.title) {
    await db.conversation.update({
      where: { id: conversationId },
      data: { title: trimmed.slice(0, 80) },
    });
  }

  const embeddingService = getEmbeddingService();
  const queryEmbedding = await embeddingService.embed(trimmed);

  const chunks = await searchChunks({
    documentIds: conversation.documentIds,
    queryEmbedding,
    limit: 8, // a bit wider than the single-document quick-ask, since this can span multiple papers
  });

  const aiService = getAIService();
  const result = await aiService.generateAnswer(trimmed, chunks);

  const assistantMessage = await db.message.create({
    data: {
      conversationId,
      role: "assistant",
      content: result.answer,
      citations: {
        create: result.citations.map((c) => {
          const source = chunks.find((ch) => ch.documentId === c.documentId && ch.pageNumber === c.pageNumber);
          return {
            documentId: c.documentId,
            pageNumber: c.pageNumber,
            excerpt: source ? source.text.slice(0, 500) : "",
          };
        }),
      },
    },
  });

  revalidatePath(`/workspace/${conversation.workspaceId}/chat/${conversationId}`);
  return { ...result, messageId: assistantMessage.id };
}

export async function deleteConversation(conversationId: string) {
  const user = await getOrCreateCurrentUser();
  if (!user) throw new Error("Not signed in");

  const conversation = await db.conversation.findFirst({
    where: { id: conversationId, workspace: { ownerId: user.id } },
    select: { id: true, workspaceId: true },
  });
  if (!conversation) throw new Error("Conversation not found");

  // Cascades to its Messages and their Citations (see prisma/schema.prisma).
  await db.conversation.delete({ where: { id: conversationId } });

  revalidatePath(`/workspace/${conversation.workspaceId}/chat`);
}

export async function getWorkspaceChatContext(workspaceId: string) {
  const user = await getOrCreateCurrentUser();
  if (!user) return null;

  const workspace = await db.workspace.findFirst({
    where: { id: workspaceId, ownerId: user.id },
    include: {
      documents: { where: { status: "READY" }, orderBy: { createdAt: "desc" } },
      conversations: { orderBy: { createdAt: "desc" } },
    },
  });
  return workspace;
}
