import Link from "next/link";
import { redirect } from "next/navigation";
import { getOrCreateCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { NewWorkspaceForm } from "@/components/workspace/new-workspace-dialog";
import { DeleteWorkspaceButton } from "@/components/workspace/delete-workspace-button";

export default async function DashboardPage() {
  const user = await getOrCreateCurrentUser();
  if (!user) redirect("/sign-in");

  const workspaces = await db.workspace.findMany({
    where: { ownerId: user.id },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { documents: true } } },
  });

  const totalPapers = workspaces.reduce((sum, w) => sum + w._count.documents, 0);

  const aiAnalyses = await db.message.count({
    where: { role: "assistant", conversation: { workspace: { ownerId: user.id } } },
  });

  return (
    <main className="container-page py-16">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs text-ink-faint dark:text-paper/40">
            {user.email}
          </p>
          <h1 className="mt-2 font-display text-3xl">Your research</h1>
        </div>
        <NewWorkspaceForm />
      </div>

      <div className="mt-4 flex flex-wrap gap-4">
        <Link href="/search" className="font-mono text-xs text-teal hover:underline dark:text-teal-muted">
          Search
        </Link>
        <Link href="/notes" className="font-mono text-xs text-teal hover:underline dark:text-teal-muted">
          Notes
        </Link>
        <Link href="/saved" className="font-mono text-xs text-teal hover:underline dark:text-teal-muted">
          Saved
        </Link>
        <Link href="/analytics" className="font-mono text-xs text-teal hover:underline dark:text-teal-muted">
          Analytics
        </Link>
      </div>

      <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <p className="font-display text-2xl">{workspaces.length}</p>
            <p className="mt-1 font-mono text-xs text-ink-faint dark:text-paper/40">Workspaces</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="font-display text-2xl">{totalPapers}</p>
            <p className="mt-1 font-mono text-xs text-ink-faint dark:text-paper/40">Papers</p>
          </CardContent>
        </Card>
        <Card className="hidden sm:block">
          <CardContent className="p-5">
            <p className="font-display text-2xl">{aiAnalyses}</p>
            <p className="mt-1 font-mono text-xs text-ink-faint dark:text-paper/40">AI analyses</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-12">
        <h2 className="font-display text-lg">Workspaces</h2>
        {workspaces.length === 0 ? (
          <p className="mt-3 font-sans text-sm text-ink-soft dark:text-paper/70">
            Nothing yet — create a workspace to start uploading papers.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-hairline border-t border-hairline dark:divide-hairline-dark dark:border-hairline-dark">
            {workspaces.map((w) => (
              <li key={w.id} className="flex items-center justify-between gap-4 py-4">
                <Link href={`/workspace/${w.id}`} className="min-w-0 flex-1 hover:opacity-70">
                  <p className="font-display text-base">{w.name}</p>
                  {w.description && (
                    <p className="mt-0.5 font-sans text-sm text-ink-soft dark:text-paper/60">{w.description}</p>
                  )}
                </Link>
                <span className="shrink-0 font-mono text-xs text-ink-faint dark:text-paper/40">
                  {w._count.documents} {w._count.documents === 1 ? "paper" : "papers"}
                </span>
                <DeleteWorkspaceButton workspaceId={w.id} workspaceName={w.name} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
