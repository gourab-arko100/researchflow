"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { del } from "@vercel/blob";
import { getOrCreateCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { createWorkspaceSchema } from "@/lib/validations";

export async function createWorkspace(formData: FormData) {
  const user = await getOrCreateCurrentUser();
  if (!user) redirect("/sign-in");

  const parsed = createWorkspaceSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid workspace" };
  }

  const workspace = await db.workspace.create({
    data: {
      name: parsed.data.name,
      description: parsed.data.description,
      ownerId: user.id,
    },
  });

  revalidatePath("/dashboard");
  redirect(`/workspace/${workspace.id}`);
}

export async function deleteWorkspace(workspaceId: string) {
  const user = await getOrCreateCurrentUser();
  if (!user) redirect("/sign-in");

  const workspace = await db.workspace.findFirst({
    where: { id: workspaceId, ownerId: user.id },
    include: { documents: { select: { fileUrl: true } } },
  });
  if (!workspace) redirect("/dashboard");

  // Clean up the actual Blob storage before dropping the DB rows — otherwise
  // every uploaded file becomes an orphaned blob nobody can see or delete
  // again, quietly eating into the free-tier storage quota.
  await Promise.all(
    workspace.documents.map((doc) => del(doc.fileUrl).catch(() => {
      // already gone, or URL invalid — not worth blocking the deletion over
    }))
  );

  // .deleteMany scoped by ownerId — a user can never delete another user's workspace
  // even if they guess the id. Cascades to Documents, DocumentPages, DocumentChunks,
  // Collections, Conversations, Messages, and Citations (see prisma/schema.prisma).
  await db.workspace.deleteMany({ where: { id: workspaceId, ownerId: user.id } });

  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function getWorkspaceForCurrentUser(workspaceId: string) {
  const user = await getOrCreateCurrentUser();
  if (!user) return null;

  return db.workspace.findFirst({
    where: { id: workspaceId, ownerId: user.id },
    include: {
      documents: { orderBy: { createdAt: "desc" } },
    },
  });
}
