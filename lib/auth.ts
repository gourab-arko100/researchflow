import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

/**
 * Returns the local User row for the signed-in Clerk session, creating it on
 * the fly if the user.created webhook hasn't landed yet. Call from server
 * components / server actions / route handlers that need a User.id to
 * scope a query (workspaces, documents, notes, ...).
 *
 * Returns null when signed out — callers behind proxy.ts's route
 * matcher won't normally hit that, but check anyway.
 */
export async function getOrCreateCurrentUser() {
  const clerkUser = await currentUser();
  if (!clerkUser) return null;

  const email = clerkUser.emailAddresses[0]?.emailAddress;
  if (!email) return null;

  const name = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || null;

  return db.user.upsert({
    where: { id: clerkUser.id },
    create: { id: clerkUser.id, email, name, settings: { create: {} } },
    update: { email, name },
  });
}
