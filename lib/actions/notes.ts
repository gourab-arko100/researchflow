"use server";

import { revalidatePath } from "next/cache";
import { getOrCreateCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

const MAX_NOTE_LENGTH = 5000;

export async function createNote(documentId: string, pageNumber: number | null, content: string, tags: string[]) {
  const user = await getOrCreateCurrentUser();
  if (!user) throw new Error("Not signed in");

  const trimmed = content.trim();
  if (!trimmed) throw new Error("Note is empty");
  if (trimmed.length > MAX_NOTE_LENGTH) throw new Error(`Keep notes under ${MAX_NOTE_LENGTH} characters`);

  const document = await db.document.findFirst({
    where: { id: documentId, workspace: { ownerId: user.id } },
    select: { id: true },
  });
  if (!document) throw new Error("Document not found");

  const note = await db.note.create({
    data: { userId: user.id, documentId, pageNumber: pageNumber ?? undefined, content: trimmed, tags },
  });

  revalidatePath(`/document/${documentId}`);
  revalidatePath("/notes");
  return note;
}

export async function updateNote(noteId: string, content: string, tags: string[]) {
  const user = await getOrCreateCurrentUser();
  if (!user) throw new Error("Not signed in");

  const note = await db.note.findFirst({ where: { id: noteId, userId: user.id } });
  if (!note) throw new Error("Note not found");

  await db.note.update({ where: { id: noteId }, data: { content: content.trim(), tags } });
  revalidatePath("/notes");
  if (note.documentId) revalidatePath(`/document/${note.documentId}`);
}

export async function deleteNote(noteId: string) {
  const user = await getOrCreateCurrentUser();
  if (!user) throw new Error("Not signed in");

  const note = await db.note.findFirst({ where: { id: noteId, userId: user.id } });
  if (!note) throw new Error("Note not found");

  await db.note.delete({ where: { id: noteId } });
  revalidatePath("/notes");
  if (note.documentId) revalidatePath(`/document/${note.documentId}`);
}

export async function listNotesForDocument(documentId: string) {
  const user = await getOrCreateCurrentUser();
  if (!user) return [];

  return db.note.findMany({
    where: { documentId, userId: user.id },
    orderBy: { createdAt: "desc" },
  });
}

export async function listAllNotes() {
  const user = await getOrCreateCurrentUser();
  if (!user) return [];

  return db.note.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { document: { select: { id: true, title: true, workspaceId: true } } },
  });
}
