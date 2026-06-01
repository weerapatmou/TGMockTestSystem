"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "หน้าหลัก" },
  { href: "/sessions/new", label: "สร้าง Mock Test" },
  { href: "/me", label: "สถิติของฉัน" },
  { href: "/methodology", label: "วิธีคิดคะแนน" },
];

export function NavLinks() {
  const pathname = usePathname();
  return (
    <nav className="hidden items-center gap-1 md:flex">
      {links.map((link) => {
        const active =
          link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
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
