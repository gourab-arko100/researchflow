import Link from "next/link";
import { notFound } from "next/navigation";
import { getWorkspaceChatContext, deleteConversation } from "@/lib/actions/chat";
import { PaperSelector } from "@/components/chat/paper-selector";

export default async function WorkspaceChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const workspace = await getWorkspaceChatContext(id);
  if (!workspace) notFound();

  return (
    <main className="container-page py-16">
      <Link href={`/workspace/${id}`} className="font-mono text-xs text-ink-faint hover:text-ink dark:text-paper/40 dark:hover:text-paper">
        ← {workspace.name}
      </Link>
      <h1 className="mt-3 font-display text-3xl">Chat</h1>

      {workspace.conversations.length > 0 && (
        <div className="mt-8">
          <h2 className="font-display text-lg">Recent conversations</h2>
          <ul className="mt-3 divide-y divide-hairline border-t border-hairline dark:divide-hairline-dark dark:border-hairline-dark">
            {workspace.conversations.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-4 py-3">
                <Link href={`/workspace/${id}/chat/${c.id}`} className="min-w-0 flex-1 hover:opacity-70">
                  <span className="block truncate font-sans text-sm text-ink dark:text-paper">
                    {c.title || "Untitled conversation"}
                  </span>
                </Link>
                <span className="shrink-0 font-mono text-xs text-ink-faint dark:text-paper/40">
                  {c.documentIds.length} {c.documentIds.length === 1 ? "paper" : "papers"}
                </span>
                <form
                  action={async () => {
                    "use server";
                    await deleteConversation(c.id);
                  }}
                >
                  <button
                    type="submit"
                    className="shrink-0 font-sans text-xs text-red-700/70 underline decoration-red-700/30 underline-offset-2 hover:text-red-700 hover:decoration-red-700 dark:text-red-400/70 dark:decoration-red-400/30 dark:hover:text-red-400 dark:hover:decoration-red-400"
                  >
                    Delete
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-10">
        <h2 className="font-display text-lg">Start a new chat</h2>
        <p className="mt-1 font-sans text-sm text-ink-soft dark:text-paper/70">
          Select one paper for a focused conversation, or several to ask questions across your library.
        </p>
        <div className="mt-4">
          <PaperSelector
            workspaceId={id}
            documents={workspace.documents.map((d) => ({ id: d.id, title: d.title, pageCount: d.pageCount }))}
          />
        </div>
      </div>
    </main>
  );
}
