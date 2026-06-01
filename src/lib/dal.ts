import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/db";

/// Returns the current session payload or null (no redirect). Memoized per request.
export const getCurrentSession = cache(getSession);

/// Returns the logged-in user (id + callsign) or null.
export const getCurrentUser = cache(async () => {
  const session = await getCurrentSession();
  if (!session) return null;
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, callsign: true, createdAt: true },
  });
  return user;
});

/// Use in protected pages/actions: returns the user or redirects to /login.
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}
