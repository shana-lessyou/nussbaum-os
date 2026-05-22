import type { BusinessDomain, Category, Domain } from "./types";

export const DOMAIN_ORDER: Domain[] = [
  "Capacera",
  "Praxemy",
  "LYMP",
  "Me",
  "Home",
  "Boys",
];

export const BUSINESS_DOMAINS: BusinessDomain[] = ["Capacera", "Praxemy", "LYMP"];
export const isBusiness = (d: Domain): d is BusinessDomain =>
  (BUSINESS_DOMAINS as readonly string[]).includes(d);

export const DOMAIN_GROUPS: { label: string; domains: Domain[] }[] = [
  { label: "Businesses", domains: ["Capacera", "Praxemy", "LYMP"] },
  { label: "Self",       domains: ["Me"] },
  { label: "Family",     domains: ["Home", "Boys"] },
];

export const DOMAIN_COLORS: Record<Domain, { dot: string; ring: string; soft: string }> = {
  Capacera: { dot: "bg-domain-capacera", ring: "ring-domain-capacera/30", soft: "bg-indigo-50"  },
  Praxemy:  { dot: "bg-domain-praxemy",  ring: "ring-domain-praxemy/30",  soft: "bg-sky-50"     },
  LYMP:     { dot: "bg-domain-lymp",     ring: "ring-domain-lymp/30",     soft: "bg-emerald-50" },
  Me:       { dot: "bg-domain-me",       ring: "ring-domain-me/30",       soft: "bg-amber-50"   },
  Home:     { dot: "bg-domain-home",     ring: "ring-domain-home/30",     soft: "bg-red-50"     },
  Boys:     { dot: "bg-domain-boys",     ring: "ring-domain-boys/30",     soft: "bg-purple-50"  },
};

// Category swatches for cards in business columns.
export const CATEGORY_META: Record<Category, { label: string; bar: string; pill: string }> = {
  build: { label: "Build", bar: "bg-sky-500",     pill: "bg-sky-100 text-sky-800" },
  sell:  { label: "Sell",  bar: "bg-emerald-500", pill: "bg-emerald-100 text-emerald-800" },
  admin: { label: "Admin", bar: "bg-zinc-400",    pill: "bg-zinc-100 text-zinc-700" },
};

// Global daily capacity (points) — flagged in top bar, not per column.
export const DAILY_CAPACITY = 14; // ~4.5 hrs at 20 min/pt
