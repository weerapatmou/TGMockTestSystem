import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/// Format a number with up to 1 decimal, dropping a trailing ".0".
export function fmt(n: number, digits = 1): string {
  if (!Number.isFinite(n)) return "–";
  const r = Number(n.toFixed(digits));
  return r.toLocaleString("en-US");
}

export function pct(n: number, digits = 1): string {
  if (!Number.isFinite(n)) return "–";
  return `${fmt(n, digits)}%`;
}

export function formatDate(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
