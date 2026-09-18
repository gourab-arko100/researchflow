"use client";

import { useEffect, useState } from "react";
import { Sun, Moon, Monitor } from "lucide-react";
import { updateTheme } from "@/lib/actions/settings";

type Theme = "light" | "dark" | "system";

const ICONS: Record<Theme, typeof Sun> = { light: Sun, dark: Moon, system: Monitor };
const NEXT: Record<Theme, Theme> = { light: "dark", dark: "system", system: "light" };

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("system");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTheme((localStorage.getItem("theme") as Theme) || "system");
    setMounted(true);
  }, []);

  const apply = (next: Theme) => {
    setTheme(next);
    localStorage.setItem("theme", next);
    const isDark = next === "dark" || (next === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("dark", isDark);
    updateTheme(next).catch(() => {
      // best-effort DB sync — localStorage is already the source of truth for this device
    });
  };

  // Avoid rendering a theme-dependent icon before we've read localStorage client-side
  if (!mounted) return <div className="h-8 w-8" />;

  const Icon = ICONS[theme];

  return (
    <button
      onClick={() => apply(NEXT[theme])}
      aria-label={`Theme: ${theme}. Click to change.`}
      title={`Theme: ${theme}`}
      className="flex h-8 w-8 items-center justify-center rounded text-ink-soft hover:bg-ink/5 hover:text-ink dark:text-paper/60 dark:hover:bg-paper/5 dark:hover:text-paper"
    >
      <Icon size={16} strokeWidth={1.75} />
    </button>
  );
}
