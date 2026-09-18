import { notFound } from "next/navigation";
import Link from "next/link";
import { getWorkspaceForCurrentUser } from "@/lib/actions/workspace";
import { Uploader } from "@/components/workspace/uploader";
import { DocumentList } from "@/components/workspace/document-list";
import { DeleteWorkspaceButton } from "@/components/workspace/delete-workspace-button";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default async function WorkspacePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const workspace = await getWorkspaceForCurrentUser(id);
  if (!workspace) notFound();

  return (
    <main className="container-page py-16">
      <Link href="/dashboard" className="font-mono text-xs text-ink-faint hover:text-ink dark:text-paper/40 dark:hover:text-paper">
        ← Dashboard
      </Link>
      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl">{workspace.name}</h1>
          {workspace.description && (
            <p className="mt-2 max-w-lg font-sans text-sm text-ink-soft dark:text-paper/70">{workspace.description}</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-3">
          <div className="flex flex-wrap gap-2">
            <Link href={`/workspace/${workspace.id}/chat`} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
              Chat with your papers
            </Link>
            <Link href={`/workspace/${workspace.id}/compare`} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
              Compare papers
            </Link>
            <Link href={`/workspace/${workspace.id}/research-gaps`} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
              Research gaps
            </Link>
            <Link href={`/workspace/${workspace.id}/literature-review`} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>
              Literature review
            </Link>
          </div>
          <DeleteWorkspaceButton workspaceId={workspace.id} workspaceName={workspace.name} />
        </div>
      </div>

      <div className="mt-10">
        <Uploader workspaceId={workspace.id} />
      </div>

      <DocumentList documents={workspace.documents} />
    </main>
  );
}
