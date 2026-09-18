"use server";

import { getOrCreateCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

/** Best-effort: theme still works via localStorage even when signed out,
 * or if this write fails for any reason — it's a preference sync, not
 * something the UI depends on to function. */
export async function updateTheme(theme: "light" | "dark" | "system") {
  const user = await getOrCreateCurrentUser();
  if (!user) return;

  await db.userSettings.upsert({
    where: { userId: user.id },
    create: { userId: user.id, theme },
    update: { theme },
  });
}
