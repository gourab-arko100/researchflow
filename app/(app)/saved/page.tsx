import { redirect } from "next/navigation";
import { getOrCreateCurrentUser } from "@/lib/auth";
import { listSavedInsights } from "@/lib/actions/saved";
import { SavedList } from "@/components/saved/saved-list";

export default async function SavedPage() {
  const user = await getOrCreateCurrentUser();
  if (!user) redirect("/sign-in");

  const insights = await listSavedInsights();

  return (
    <main className="container-page max-w-2xl py-16">
      <h1 className="font-display text-3xl">Saved</h1>
      <p className="mt-2 font-sans text-sm text-ink-soft dark:text-paper/70">
        AI answers you've bookmarked while reading or chatting.
      </p>
      <div className="mt-8">
        <SavedList
          initialInsights={insights.map((i) => ({
            id: i.id,
            kind: i.kind,
            content: i.content,
            sourceRef: i.sourceRef,
            createdAt: i.createdAt.toISOString(),
          }))}
        />
      </div>
    </main>
  );
}
