import { redirect } from "next/navigation";
import { getOrCreateCurrentUser } from "@/lib/auth";
import { listAllNotes } from "@/lib/actions/notes";
import { NotesList } from "@/components/notes/notes-list";

export default async function NotesPage() {
  const user = await getOrCreateCurrentUser();
  if (!user) redirect("/sign-in");

  const notes = await listAllNotes();

  return (
    <main className="container-page max-w-2xl py-16">
      <h1 className="font-display text-3xl">Notes</h1>
      <p className="mt-2 font-sans text-sm text-ink-soft dark:text-paper/70">
        Everything you've noted while reading, across every workspace.
      </p>
      <div className="mt-8">
        <NotesList
          initialNotes={notes.map((n) => ({
            id: n.id,
            content: n.content,
            pageNumber: n.pageNumber,
            tags: n.tags,
            createdAt: n.createdAt.toISOString(),
            document: n.document,
          }))}
        />
      </div>
    </main>
  );
}
