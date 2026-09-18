"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { createNote, deleteNote } from "@/lib/actions/notes";

type Note = { id: string; content: string; pageNumber: number | null; tags: string[]; createdAt: string };

export function NotesPanel({
  documentId,
  currentPage,
  initialNotes,
  onJumpToPage,
}: {
  documentId: string;
  currentPage: number;
  initialNotes: Note[];
  onJumpToPage: (page: number) => void;
}) {
  const [notes, setNotes] = useState(initialNotes);
  const [content, setContent] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [isPending, startTransition] = useTransition();

  const add = () => {
    if (!content.trim()) return;
    const tags = tagsInput.split(",").map((t) => t.trim()).filter(Boolean);
    startTransition(async () => {
      const note = await createNote(documentId, currentPage, content, tags);
      setNotes((prev) => [{ ...note, createdAt: note.createdAt.toISOString() }, ...prev]);
      setContent("");
      setTagsInput("");
    });
  };

  const remove = (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    startTransition(async () => {
      await deleteNote(id);
    });
  };

  return (
    <div className="mt-6 border-t border-hairline pt-4 dark:border-hairline-dark">
      <p className="font-mono text-xs text-ink-faint dark:text-paper/40">Notes ({notes.length})</p>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={`Note on page ${currentPage}…`}
        rows={2}
        className="mt-2 w-full rounded border border-hairline bg-paper-raised p-2 font-sans text-xs text-ink dark:border-hairline-dark dark:bg-paper-dark-raised dark:text-paper"
      />
      <div className="mt-2 flex gap-2">
        <input
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
          placeholder="tags, comma-separated"
          className="h-8 flex-1 rounded border border-hairline bg-paper-raised px-2 font-sans text-xs text-ink dark:border-hairline-dark dark:bg-paper-dark-raised dark:text-paper"
        />
        <Button size="sm" onClick={add} disabled={isPending || !content.trim()}>
          Add
        </Button>
      </div>

      {notes.length > 0 && (
        <ul className="mt-4 space-y-3">
          {notes.map((n) => (
            <li key={n.id} className="rounded border border-hairline p-2.5 dark:border-hairline-dark">
              <div className="flex items-start justify-between gap-2">
                <button
                  onClick={() => n.pageNumber && onJumpToPage(n.pageNumber)}
                  className="font-mono text-[11px] text-teal hover:underline dark:text-teal-muted"
                >
                  {n.pageNumber ? `Page ${n.pageNumber}` : "No page"}
                </button>
                <button
                  onClick={() => remove(n.id)}
                  className="font-mono text-[11px] text-red-700/70 hover:text-red-700 dark:text-red-400/70 dark:hover:text-red-400"
                >
                  Delete
                </button>
              </div>
              <p className="mt-1 whitespace-pre-wrap font-sans text-xs leading-relaxed text-ink dark:text-paper/90">
                {n.content}
              </p>
              {n.tags.length > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {n.tags.map((t) => (
                    <span key={t} className="rounded-sm bg-ink/5 px-1.5 py-0.5 font-mono text-[10px] text-ink-soft dark:bg-paper/10 dark:text-paper/60">
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
