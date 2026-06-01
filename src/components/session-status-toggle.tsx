"use client";

import { useTransition } from "react";
import { setSessionStatus } from "@/actions/sessions";
import { Button } from "@/components/ui/button";

/// Compact open/close-scoring toggle for an owned session.
/// Mirrors the control on the session detail page so owners can flip a
/// session's status straight from the dashboard card.
export function SessionStatusToggle({
  sessionId,
  status,
}: {
  sessionId: string;
  status: "DRAFT" | "OPEN" | "CLOSED";
}) {
  const [pending, start] = useTransition();
  const isOpen = status === "OPEN";

  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={pending}
      className={isOpen ? "text-faint hover:text-warn" : "text-faint hover:text-good"}
      onClick={() =>
        start(() => setSessionStatus(sessionId, isOpen ? "CLOSED" : "OPEN"))
      }
    >
      {pending ? "กำลังบันทึก…" : isOpen ? "ปิดรับคะแนน" : "เปิดรับคะแนน"}
    </Button>
  );
}
