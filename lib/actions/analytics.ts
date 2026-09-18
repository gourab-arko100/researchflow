"use server";

import { getOrCreateCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function getAnalytics() {
  const user = await getOrCreateCurrentUser();
  if (!user) return null;

  const workspaces = await db.workspace.findMany({
    where: { ownerId: user.id },
    select: {
      id: true,
      name: true,
      documents: { select: { createdAt: true } },
      conversations: { select: { id: true } },
    },
  });

  const totalPapers = workspaces.reduce((sum, w) => sum + w.documents.length, 0);
  const totalConversations = workspaces.reduce((sum, w) => sum + w.conversations.length, 0);

  const [totalNotes, totalSaved, aiMessages] = await Promise.all([
    db.note.count({ where: { userId: user.id } }),
    db.savedInsight.count({ where: { userId: user.id } }),
    db.message.count({
      where: { role: "assistant", conversation: { workspace: { ownerId: user.id } } },
    }),
  ]);

  // Papers by month (deterministic grouping, no AI needed)
  const monthCounts = new Map<string, number>();
  for (const w of workspaces) {
    for (const doc of w.documents) {
      const key = doc.createdAt.toISOString().slice(0, 7); // YYYY-MM
      monthCounts.set(key, (monthCounts.get(key) ?? 0) + 1);
    }
  }
  const papersByMonth = [...monthCounts.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([month, count]) => ({ month, count }));

  const papersByWorkspace = workspaces
    .map((w) => ({ name: w.name, count: w.documents.length }))
    .filter((w) => w.count > 0)
    .sort((a, b) => b.count - a.count);

  return {
    totalWorkspaces: workspaces.length,
    totalPapers,
    totalConversations,
    totalNotes,
    totalSaved,
    aiMessages,
    papersByMonth,
    papersByWorkspace,
  };
}
