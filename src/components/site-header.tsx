import Link from "next/link";
import { getCurrentUser } from "@/lib/dal";
import { LogoutButton } from "@/components/logout-button";
import { Badge } from "@/components/ui/primitives";
import { NavLinks } from "@/components/nav-links";
import { MobileNav } from "@/components/mobile-nav";
import { MascotBadge } from "@/components/mascot";

export async function SiteHeader() {
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-bg/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-4 px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <MascotBadge className="h-7 w-7" />
          <span className="hidden sm:inline">Mock Test Stat</span>
        </Link>

        {user ? <NavLinks /> : null}

        <div className="ml-auto flex items-center gap-2">
          {user ? (
            <>
              <Badge tone="accent" className="font-mono">
                {user.callsign}
              </Badge>
              <LogoutButton />
              <MobileNav />
            </>
          ) : null}
        </div>
      </div>
    </header>
  );
}
