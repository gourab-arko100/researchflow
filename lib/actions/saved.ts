"use server";

import { revalidatePath } from "next/cache";
import { getOrCreateCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

const MAX_INSIGHT_LENGTH = 10000;
const ALLOWED_KINDS = ["ai_response", "research_gap", "citation", "section"];

export async function saveInsight(kind: string, content: string, sourceRef?: string) {
  const user = await getOrCreateCurrentUser();
  if (!user) throw new Error("Not signed in");

  if (!ALLOWED_KINDS.includes(kind)) throw new Error("Invalid insight type");

  const trimmed = content.trim();
  if (!trimmed) throw new Error("Nothing to save");
  if (trimmed.length > MAX_INSIGHT_LENGTH) throw new Error(`Keep saved content under ${MAX_INSIGHT_LENGTH} characters`);

  const insight = await db.savedInsight.create({
    data: { userId: user.id, kind, content: trimmed, sourceRef },
  });

  revalidatePath("/saved");
  return insight;
}

export async function deleteSavedInsight(id: string) {
  const user = await getOrCreateCurrentUser();
  if (!user) throw new Error("Not signed in");

  await db.savedInsight.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/saved");
}

export async function listSavedInsights() {
  const user = await getOrCreateCurrentUser();
  if (!user) return [];

  return db.savedInsight.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });
}
