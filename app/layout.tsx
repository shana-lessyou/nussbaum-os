import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Nussbaum OS — Be Mom First",
  description: "Personal operating system: Kanban + daily scorecard + capture.",
  viewport: "width=device-width, initial-scale=1",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-bg text-ink font-sans">{children}</body>
    </html>
  );
}
