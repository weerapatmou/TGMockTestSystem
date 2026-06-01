"use client";

import { useTransition } from "react";
import { logout } from "@/actions/auth";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const [pending, start] = useTransition();
  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={pending}
      onClick={() => start(() => logout())}
    >
      {pending ? "กำลังออก…" : "ออกจากระบบ"}
    </Button>
  );
}
