"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/dal";
import { submitScoresSchema } from "@/lib/validation";

export type SubmitScoresResult =
  | { ok: false; message: string }
  | { ok: true; saved: number };

/// Upsert the current user's scores for a session (one row per part).
/// Re-submitting overwrites previous values; blank parts are skipped/deleted.
export async function submitScores(input: unknown): Promise<SubmitScoresResult> {
  const user = await requireUser();

  const parsed = submitScoresSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, message: first?.message ?? "ข้อมูลไม่ถูกต้อง" };
  }
  const { sessionId, scores } = parsed.data;

  const session = await prisma.mockSession.findUnique({
    where: { id: sessionId },
    select: { status: true, sets: { select: { parts: { select: { id: true, totalQuestions: true } } } } },
  });
  if (!session) return { ok: false, message: "ไม่พบ Mock Test" };
  if (session.status === "CLOSED") {
    return { ok: false, message: "Mock Test นี้ปิดรับคะแนนแล้ว" };
  }

  // Only accept parts that actually belong to this session.
  const validParts = new Map(
    session.sets.flatMap((s) => s.parts).map((p) => [p.id, p.totalQuestions]),
  );

  const ops = [];
  for (const s of scores) {
    if (!validParts.has(s.partId)) continue;
    ops.push(
      prisma.score.upsert({
        where: { partId_userId: { partId: s.partId, userId: user.id } },
        create: {
          partId: s.partId,
          userId: user.id,
          scoreGot: s.scoreGot,
          questionsAttempted: s.questionsAttempted,
          totalQuestions: s.totalQuestions,
        },
        update: {
          scoreGot: s.scoreGot,
          questionsAttempted: s.questionsAttempted,
          totalQuestions: s.totalQuestions,
        },
      }),
    );
  }

  await prisma.$transaction(ops);

  revalidatePath(`/sessions/${sessionId}`);
  revalidatePath(`/sessions/${sessionId}/results`);
  revalidatePath("/me");
  return { ok: true, saved: ops.length };
}
