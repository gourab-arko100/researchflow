import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getOrCreateCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { ChatThread } from "@/components/chat/chat-thread";
import { deleteConversation } from "@/lib/actions/chat";

export default async function ChatThreadPage({
  params,
}: {
  params: Promise<{ id: string; conversationId: string }>;
}) {
  const { id, conversationId } = await params;
  const user = await getOrCreateCurrentUser();
  if (!user) notFound();

  const conversation = await db.conversation.findFirst({
    where: { id: conversationId, workspace: { ownerId: user.id } },
    include: {
      workspace: { select: { id: true, name: true } },
      messages: {
        orderBy: { createdAt: "asc" },
        include: { citations: { include: { document: { select: { title: true } } } } },
      },
    },
  });
  if (!conversation) notFound();

  const papers = await db.document.findMany({
    where: { id: { in: conversation.documentIds } },
    select: { id: true, title: true },
  });

  return (
    <main className="container-page flex min-h-[calc(100vh-4rem)] flex-col py-8">
      <div>
        <div className="flex items-start justify-between gap-4">
          <Link
            href={`/workspace/${id}/chat`}
            className="font-mono text-xs text-ink-faint hover:text-ink dark:text-paper/40 dark:hover:text-paper"
          >
            ← Chat
          </Link>
          <form
            action={async () => {
              "use server";
              await deleteConversation(conversationId);
              redirect(`/workspace/${id}/chat`);
            }}
          >
            <button
              type="submit"
              className="font-mono text-xs text-red-700/70 underline decoration-red-700/30 underline-offset-2 hover:text-red-700 hover:decoration-red-700 dark:text-red-400/70 dark:decoration-red-400/30 dark:hover:text-red-400 dark:hover:decoration-red-400"
            >
              Delete conversation
            </button>
          </form>
        </div>
        <p className="mt-2 font-mono text-xs text-ink-faint dark:text-paper/40">
          Chatting with {papers.map((p) => p.title).join(", ")}
        </p>
      </div>

      <ChatThread
        conversationId={conversation.id}
        initialMessages={conversation.messages.map((m) => ({
          id: m.id,
          role: m.role as "user" | "assistant",
          content: m.content,
          citations: m.citations.map((c) => ({
            documentId: c.documentId,
            documentTitle: c.document.title,
            pageNumber: c.pageNumber,
          })),
        }))}
      />
    </main>
  );
}
