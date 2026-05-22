import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#f7f6f3",
        surface: "#ffffff",
        ink: "#1f2937",
        muted: "#6b7280",
        line: "#e5e7eb",
        domain: {
          capacera: "#6366f1",
          praxemy: "#0ea5e9",
          lymp: "#10b981",
          me: "#f59e0b",
          home: "#ef4444",
          boys: "#a855f7",
        },
      },
      fontFamily: {
        sans: [
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Inter",
          "sans-serif",
        ],
      },
      boxShadow: {
        card: "0 1px 2px rgba(15,23,42,0.04), 0 1px 3px rgba(15,23,42,0.06)",
      },
    },
  },
  plugins: [],
};

export default config;
