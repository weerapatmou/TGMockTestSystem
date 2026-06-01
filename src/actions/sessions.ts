"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/dal";
import { createSessionSchema, fieldErrors } from "@/lib/validation";

export type CreateSessionResult =
  | { ok: false; errors?: Record<string, string>; message?: string }
  | { ok: true; id: string };

/// Create a weekly Mock Test with its sets and parts. Any logged-in user may do this.
export async function createSession(input: unknown): Promise<CreateSessionResult> {
  const user = await requireUser();

  const parsed = createSessionSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, errors: fieldErrors(parsed.error) };
  }
  const data = parsed.data;

  // Validate that every referenced topic exists.
  const topicIds = [
    ...new Set(data.sets.flatMap((s) => s.parts.map((p) => p.topicId))),
  ];
  const found = await prisma.topic.count({ where: { id: { in: topicIds } } });
  if (found !== topicIds.length) {
    return { ok: false, message: "มีหัวข้อที่ไม่ถูกต้อง กรุณาเลือกใหม่" };
  }

  const session = await prisma.mockSession.create({
    data: {
      title: data.title,
      eventDate: new Date(data.eventDate),
      note: data.note || null,
      bonusWeight: data.bonusWeight,
      createdById: user.id,
      sets: {
        create: data.sets.map((set, si) => ({
          name: set.name,
          order: si,
          parts: {
            create: set.parts.map((part, pi) => ({
              topicId: part.topicId,
              label: part.label || null,
              totalQuestions: part.totalQuestions,
              order: pi,
            })),
          },
        })),
      },
    },
    select: { id: true },
  });

  revalidatePath("/");
  return { ok: true, id: session.id };
}

async function ownedSessionOrThrow(sessionId: string, userId: string) {
  const session = await prisma.mockSession.findUnique({
    where: { id: sessionId },
    select: { id: true, createdById: true },
  });
  if (!session) throw new Error("ไม่พบ Mock Test");
  if (session.createdById !== userId) throw new Error("คุณไม่ใช่ผู้สร้าง Mock Test นี้");
  return session;
}

export async function setSessionStatus(
  sessionId: string,
  status: "OPEN" | "CLOSED",
) {
  const user = await requireUser();
  await ownedSessionOrThrow(sessionId, user.id);
  await prisma.mockSession.update({ where: { id: sessionId }, data: { status } });
  revalidatePath(`/sessions/${sessionId}`);
  revalidatePath(`/sessions/${sessionId}/results`);
  revalidatePath("/");
}

export async function deleteSession(sessionId: string) {
  const user = await requireUser();
  await ownedSessionOrThrow(sessionId, user.id);
  await prisma.mockSession.delete({ where: { id: sessionId } });
  revalidatePath("/");
  redirect("/");
}
