"use server";

import { revalidatePath } from "next/cache";
import { getOrCreateCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { assertRateLimit } from "@/lib/rate-limit";
import { assertId, assertText } from "@/lib/validations";

const MAX_INSIGHT_LENGTH = 10000;
const ALLOWED_KINDS = ["ai_response", "research_gap", "citation", "section"];

export async function saveInsight(kind: string, content: string, sourceRef?: string) {
  const user = await getOrCreateCurrentUser();
  if (!user) throw new Error("Not signed in");

  if (typeof kind !== "string" || !ALLOWED_KINDS.includes(kind)) throw new Error("Invalid insight type");

  const trimmed = assertText(content, MAX_INSIGHT_LENGTH, "saved content");
  if (sourceRef != null && (typeof sourceRef !== "string" || sourceRef.length > 200)) {
    throw new Error("Invalid source reference");
  }
  await assertRateLimit(`saved:${user.id}`, 60, 5 * 60 * 1000);

  const insight = await db.savedInsight.create({
    data: { userId: user.id, kind, content: trimmed, sourceRef },
  });

  revalidatePath("/saved");
  return insight;
}

export async function deleteSavedInsight(id: string) {
  const user = await getOrCreateCurrentUser();
  if (!user) throw new Error("Not signed in");

  assertId(id, "saved item");
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
