"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/dal";
import { CATEGORIES, type Category } from "@/lib/topics";

type Topic = { id: string; name: string; category: Category };

export type TopicActionResult =
  | { ok: true; topic: Topic }
  | { ok: false; message: string };

export type DeleteTopicResult =
  | { ok: true }
  | { ok: false; message: string; inUse?: boolean };

const createTopicSchema = z.object({
  name: z.string().trim().min(1, "กรุณาระบุชื่อหัวข้อ").max(80),
  category: z.enum(CATEGORIES, { message: "หมวดหมู่ไม่ถูกต้อง" }),
});

const updateTopicSchema = createTopicSchema.extend({ id: z.string().min(1) });

function revalidate() {
  revalidatePath("/settings/topics");
  revalidatePath("/sessions/new");
}

function isDuplicateError(e: unknown) {
  return (
    e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002"
  );
}

function isNotFoundError(e: unknown) {
  return (
    e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025"
  );
}

export async function createTopic(input: unknown): Promise<TopicActionResult> {
  await requireUser();

  const parsed = createTopicSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" };
  }

  const { name, category } = parsed.data;

  try {
    const topic = await prisma.topic.create({
      data: { name, category },
      select: { id: true, name: true, category: true },
    });
    revalidate();
    return { ok: true, topic: { ...topic, category: topic.category as Category } };
  } catch (e) {
    if (isDuplicateError(e)) {
      return { ok: false, message: "หัวข้อนี้มีอยู่แล้วในหมวดหมู่นั้น" };
    }
    throw e;
  }
}

export async function updateTopic(input: unknown): Promise<TopicActionResult> {
  await requireUser();

  const parsed = updateTopicSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" };
  }

  const { id, name, category } = parsed.data;

  try {
    const topic = await prisma.topic.update({
      where: { id },
      data: { name, category },
      select: { id: true, name: true, category: true },
    });
    revalidate();
    return { ok: true, topic: { ...topic, category: topic.category as Category } };
  } catch (e) {
    if (isDuplicateError(e)) return { ok: false, message: "หัวข้อนี้มีอยู่แล้วในหมวดหมู่นั้น" };
    if (isNotFoundError(e)) return { ok: false, message: "ไม่พบหัวข้อนี้" };
    throw e;
  }
}

export async function deleteTopic(id: string): Promise<DeleteTopicResult> {
  await requireUser();

  const count = await prisma.part.count({ where: { topicId: id } });
  if (count > 0) {
    return {
      ok: false,
      inUse: true,
      message: `หัวข้อนี้ถูกใช้ใน ${count} part อยู่ ลบไม่ได้`,
    };
  }

  try {
    await prisma.topic.delete({ where: { id } });
    revalidate();
    return { ok: true };
  } catch (e) {
    if (isNotFoundError(e)) return { ok: false, message: "ไม่พบหัวข้อนี้" };
    throw e;
  }
}
