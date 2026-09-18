import { redirect } from "next/navigation";
import { getOrCreateCurrentUser } from "@/lib/auth";
import { getAnalytics } from "@/lib/actions/analytics";
import { Card, CardContent } from "@/components/ui/card";
import { PapersByMonthChart, PapersByWorkspaceChart } from "@/components/analytics/charts";

export default async function AnalyticsPage() {
  const user = await getOrCreateCurrentUser();
  if (!user) redirect("/sign-in");

  const stats = await getAnalytics();
  if (!stats) redirect("/sign-in");

  return (
    <main className="container-page py-16">
      <h1 className="font-display text-3xl">Research analytics</h1>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {[
          { label: "Workspaces", value: stats.totalWorkspaces },
          { label: "Papers", value: stats.totalPapers },
          { label: "AI analyses", value: stats.aiMessages },
          { label: "Notes", value: stats.totalNotes },
          { label: "Saved", value: stats.totalSaved },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-5">
              <p className="font-display text-2xl">{s.value}</p>
              <p className="mt-1 font-mono text-xs text-ink-faint dark:text-paper/40">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {stats.papersByMonth.length > 0 && (
        <div className="mt-12">
          <h2 className="font-display text-lg">Papers uploaded over time</h2>
          <div className="mt-4">
            <PapersByMonthChart data={stats.papersByMonth} />
          </div>
        </div>
      )}

      {stats.papersByWorkspace.length > 0 && (
        <div className="mt-12">
          <h2 className="font-display text-lg">Papers by workspace</h2>
          <div className="mt-4">
            <PapersByWorkspaceChart data={stats.papersByWorkspace} />
          </div>
        </div>
      )}

      {stats.totalPapers === 0 && (
        <p className="mt-12 font-sans text-sm text-ink-faint dark:text-paper/40">
          Upload a few papers to see charts here.
        </p>
      )}
    </main>
  );
}
