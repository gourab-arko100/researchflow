"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";

const gridColor = "rgba(20,23,28,0.08)";

export function PapersByMonthChart({ data }: { data: { month: string; count: number }[] }) {
  if (data.length === 0) return null;
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
        <XAxis dataKey="month" tick={{ fontSize: 11, fontFamily: "var(--font-plex-mono)" }} axisLine={{ stroke: gridColor }} tickLine={false} />
        <YAxis allowDecimals={false} tick={{ fontSize: 11, fontFamily: "var(--font-plex-mono)" }} axisLine={false} tickLine={false} width={24} />
        <Tooltip
          contentStyle={{ fontSize: 12, fontFamily: "var(--font-plex-sans)", borderRadius: 4, borderColor: gridColor }}
        />
        <Bar dataKey="count" fill="#A8763E" radius={[2, 2, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function PapersByWorkspaceChart({ data }: { data: { name: string; count: number }[] }) {
  if (data.length === 0) return null;
  return (
    <ResponsiveContainer width="100%" height={Math.max(120, data.length * 40)}>
      <BarChart data={data} layout="vertical" margin={{ left: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={false} />
        <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fontFamily: "var(--font-plex-mono)" }} axisLine={false} tickLine={false} />
        <YAxis
          type="category"
          dataKey="name"
          tick={{ fontSize: 12, fontFamily: "var(--font-plex-sans)" }}
          axisLine={false}
          tickLine={false}
          width={120}
        />
        <Tooltip contentStyle={{ fontSize: 12, fontFamily: "var(--font-plex-sans)", borderRadius: 4, borderColor: gridColor }} />
        <Bar dataKey="count" fill="#2F5D5A" radius={[0, 2, 2, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
