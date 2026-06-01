"use client";

import { useTransition } from "react";
import { setSessionStatus, deleteSession } from "@/actions/sessions";
import { Button } from "@/components/ui/button";

export function SessionOwnerControls({
  sessionId,
  status,
}: {
  sessionId: string;
  status: "DRAFT" | "OPEN" | "CLOSED";
}) {
  const [pending, start] = useTransition();
  const closed = status === "CLOSED";

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="secondary"
        size="sm"
        disabled={pending}
        onClick={() =>
          start(() => setSessionStatus(sessionId, closed ? "OPEN" : "CLOSED"))
        }
      >
        {closed ? "เปิดรับคะแนนอีกครั้ง" : "ปิดรับคะแนน"}
      </Button>
      <Button
        variant="danger"
        size="sm"
        disabled={pending}
        onClick={() => {
          if (confirm("ลบ Mock Test นี้และคะแนนทั้งหมด? การกระทำนี้ย้อนกลับไม่ได้")) {
            start(() => deleteSession(sessionId));
          }
        }}
      >
        ลบ
      </Button>
    </div>
  );
}
