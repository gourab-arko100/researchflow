"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { deleteNote, updateNote } from "@/lib/actions/notes";

type Note = {
  id: string;
  content: string;
  pageNumber: number | null;
  tags: string[];
  createdAt: string;
  document: { id: string; title: string; workspaceId: string } | null;
};

function NoteRow({ note, onRemoved }: { note: Note; onRemoved: (id: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState(note.content);
  const [isPending, startTransition] = useTransition();

  const save = () => {
    startTransition(async () => {
      await updateNote(note.id, content, note.tags);
      setEditing(false);
    });
  };

  const remove = () => {
    onRemoved(note.id);
    startTransition(async () => {
      await deleteNote(note.id);
    });
  };

  return (
    <li className="py-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          {note.document && (
            <Link
              href={`/document/${note.document.id}${note.pageNumber ? `?page=${note.pageNumber}` : ""}`}
              className="font-mono text-xs text-teal hover:underline dark:text-teal-muted"
            >
              {note.document.title}
              {note.pageNumber ? ` · p.${note.pageNumber}` : ""}
            </Link>
          )}
        </div>
        <div className="flex shrink-0 gap-3">
          <button onClick={() => setEditing((e) => !e)} className="font-mono text-xs text-ink-faint hover:text-ink dark:text-paper/40 dark:hover:text-paper">
            {editing ? "Cancel" : "Edit"}
          </button>
          <button onClick={remove} className="font-mono text-xs text-red-700/70 hover:text-red-700 dark:text-red-400/70 dark:hover:text-red-400">
            Delete
          </button>
        </div>
      </div>

      {editing ? (
        <div className="mt-2">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={3}
            className="w-full rounded border border-hairline bg-paper-raised p-2 font-sans text-sm text-ink dark:border-hairline-dark dark:bg-paper-dark-raised dark:text-paper"
          />
          <button
            onClick={save}
            disabled={isPending}
            className="mt-1.5 font-mono text-xs text-teal hover:underline dark:text-teal-muted"
          >
            {isPending ? "Saving…" : "Save"}
          </button>
        </div>
      ) : (
        <p className="mt-1.5 whitespace-pre-wrap font-sans text-sm leading-relaxed text-ink dark:text-paper/90">
          {note.content}
        </p>
      )}

      {note.tags.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {note.tags.map((t) => (
            <span key={t} className="rounded-sm bg-ink/5 px-1.5 py-0.5 font-mono text-[10px] text-ink-soft dark:bg-paper/10 dark:text-paper/60">
              {t}
            </span>
          ))}
        </div>
      )}
    </li>
  );
}

export function NotesList({ initialNotes }: { initialNotes: Note[] }) {
  const [notes, setNotes] = useState(initialNotes);

  if (notes.length === 0) {
    return <p className="font-sans text-sm text-ink-faint dark:text-paper/40">No notes yet — add one from a document's reader.</p>;
  }

  return (
    <ul className="divide-y divide-hairline border-t border-hairline dark:divide-hairline-dark dark:border-hairline-dark">
      {notes.map((n) => (
        <NoteRow key={n.id} note={n} onRemoved={(id) => setNotes((prev) => prev.filter((x) => x.id !== id))} />
      ))}
    </ul>
  );
}
