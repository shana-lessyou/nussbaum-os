import type { BusinessDomain, Category, Domain, Subdomain } from "./types";

export const DOMAIN_ORDER: Domain[] = ["Capacera", "Praxemy", "LYMP", "Personal"];

export const BUSINESS_DOMAINS: BusinessDomain[] = ["Capacera", "Praxemy", "LYMP"];
export const isBusiness = (d: Domain): d is BusinessDomain =>
  (BUSINESS_DOMAINS as readonly string[]).includes(d);

export const SUBDOMAIN_ORDER: Subdomain[] = ["me", "home", "boys"];

export const DOMAIN_COLORS: Record<Domain, { dot: string; ring: string; soft: string }> = {
  Capacera: { dot: "bg-domain-capacera", ring: "ring-domain-capacera/30", soft: "bg-indigo-50"  },
  Praxemy:  { dot: "bg-domain-praxemy",  ring: "ring-domain-praxemy/30",  soft: "bg-sky-50"     },
  LYMP:     { dot: "bg-domain-lymp",     ring: "ring-domain-lymp/30",     soft: "bg-emerald-50" },
  Personal: { dot: "bg-domain-me",       ring: "ring-domain-me/30",       soft: "bg-amber-50"   },
};

export const SUBDOMAIN_META: Record<Subdomain, { label: string; pill: string; ring: string }> = {
  me:   { label: "Me",   pill: "bg-amber-100 text-amber-800",   ring: "ring-amber-300" },
  home: { label: "Home", pill: "bg-red-100 text-red-800",       ring: "ring-red-300" },
  boys: { label: "Boys", pill: "bg-purple-100 text-purple-800", ring: "ring-purple-300" },
};

export const CATEGORY_META: Record<Category, { label: string; bar: string; pill: string }> = {
  build: { label: "Build", bar: "bg-sky-500",     pill: "bg-sky-100 text-sky-800" },
  sell:  { label: "Sell",  bar: "bg-emerald-500", pill: "bg-emerald-100 text-emerald-800" },
  admin: { label: "Admin", bar: "bg-zinc-400",    pill: "bg-zinc-100 text-zinc-700" },
};

// Global daily capacity (points) — flagged in top bar.
export const DAILY_CAPACITY = 14; // ~4.5 hrs at 20 min/pt
