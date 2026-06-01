"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export const NAV_LINKS = [
  { href: "/", label: "หน้าหลัก" },
  { href: "/sessions/new", label: "สร้าง Mock Test" },
  { href: "/me", label: "สถิติของฉัน" },
  { href: "/methodology", label: "วิธีคิดคะแนน" },
];

/// True when `href` is the active route (exact match for "/", prefix otherwise).
export function isActiveLink(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function NavLinks() {
  const pathname = usePathname();
  return (
    <nav className="hidden items-center gap-1 md:flex">
      {NAV_LINKS.map((link) => {
        const active = isActiveLink(pathname, link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm transition-colors",
              active
                ? "bg-surface-2 text-foreground"
                : "text-muted hover:text-foreground hover:bg-surface-2/60",
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
