import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Editorial / library palette — see design plan.
        ink: {
          DEFAULT: "#14171C",
          soft: "#3A3F47",
          faint: "#6B7078",
        },
        paper: {
          DEFAULT: "#F7F6F2",
          raised: "#FCFBF8",
          dark: "#111412",
          "dark-raised": "#171B18",
        },
        hairline: {
          DEFAULT: "#DEDAD0",
          dark: "#2A2F2B",
        },
        brass: {
          DEFAULT: "#A8763E",
          muted: "#C9A876",
          dark: "#8A6231",
        },
        teal: {
          DEFAULT: "#2F5D5A",
          muted: "#4A7D79",
          dark: "#1F413F",
        },
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "ui-serif", "Georgia", "serif"],
        sans: ["var(--font-plex-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-plex-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      fontSize: {
        // Elements of Typographic Style-ish scale, keyed to a 1.25 ratio
        xs: ["0.75rem", { lineHeight: "1.1rem" }],
        sm: ["0.875rem", { lineHeight: "1.35rem" }],
        base: ["1rem", { lineHeight: "1.6rem" }],
        lg: ["1.125rem", { lineHeight: "1.75rem" }],
        xl: ["1.375rem", { lineHeight: "1.9rem" }],
        "2xl": ["1.75rem", { lineHeight: "2.15rem" }],
        "3xl": ["2.25rem", { lineHeight: "2.5rem" }],
        "4xl": ["2.9rem", { lineHeight: "3.1rem" }],
        "5xl": ["3.75rem", { lineHeight: "3.85rem" }],
      },
      maxWidth: {
        prose: "38rem",
      },
      borderRadius: {
        sm: "3px",
        DEFAULT: "5px",
        md: "6px",
        lg: "8px",
      },
      boxShadow: {
        none: "none",
        hairline: "0 0 0 1px rgba(20,23,28,0.08)",
      },
      keyframes: {
        "reveal": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        reveal: "reveal 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards",
      },
    },
  },
  plugins: [],
};

export default config;
