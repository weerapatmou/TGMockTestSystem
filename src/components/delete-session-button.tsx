"use client";

import { useTransition } from "react";
import { deleteSession } from "@/actions/sessions";
import { Button } from "@/components/ui/button";

export function DeleteSessionButton({
  sessionId,
  title,
}: {
  sessionId: string;
  title: string;
}) {
  const [pending, start] = useTransition();
  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={pending}
      className="text-faint hover:text-bad"
      onClick={() => {
        if (
          confirm(`ลบ "${title}" และคะแนนทั้งหมด? การกระทำนี้ย้อนกลับไม่ได้`)
        ) {
          start(() => deleteSession(sessionId));
        }
      }}
    >
      {pending ? "กำลังลบ…" : "ลบ"}
    </Button>
  );
}
