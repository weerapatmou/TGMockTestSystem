"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { NAV_LINKS, isActiveLink } from "@/components/nav-links";

/// Hamburger menu shown only below the `md` breakpoint, where the inline
/// nav is hidden. Opens a dropdown of the same links under the header.
export function MobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Close on route change so the panel doesn't linger after navigating.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-label={open ? "ปิดเมนู" : "เปิดเมนู"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="grid h-9 w-9 place-items-center rounded-lg text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
      >
        {open ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        )}
      </button>

      {open ? (
        <>
          <button
            aria-hidden
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="fixed inset-x-0 bottom-0 top-14 z-30 cursor-default bg-bg/60"
          />
          <nav className="absolute inset-x-0 top-14 z-40 border-b border-border bg-bg-elevated shadow-xl">
            <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-3">
              {NAV_LINKS.map((link) => {
                const active = isActiveLink(pathname, link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "rounded-lg px-3 py-2.5 text-sm transition-colors",
                      active
                        ? "bg-surface-2 text-foreground"
                        : "text-muted hover:bg-surface-2/60 hover:text-foreground",
                    )}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </nav>
        </>
      ) : null}
    </div>
  );
}
