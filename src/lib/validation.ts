import { z } from "zod";

/// Callsign: 2–20 chars, letters/numbers/_/-/space, must contain a non-space char.
export const callsignSchema = z
  .string()
  .trim()
  .min(2, "Callsign ต้องมีอย่างน้อย 2 ตัวอักษร")
  .max(20, "Callsign ต้องไม่เกิน 20 ตัวอักษร")
  .regex(/^[A-Za-z0-9_\- ]+$/, "ใช้ได้เฉพาะตัวอักษร ตัวเลข เว้นวรรค _ และ -");

export const passwordSchema = z
  .string()
  .min(6, "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร")
  .max(100, "รหัสผ่านยาวเกินไป");

export const registerSchema = z.object({
  callsign: callsignSchema,
  password: passwordSchema,
});

export const loginSchema = z.object({
  callsign: z.string().trim().min(1, "กรอก Callsign"),
  password: z.string().min(1, "กรอกรหัสผ่าน"),
});

/// One part within a set when building a session.
export const partInputSchema = z.object({
  topicId: z.string().min(1, "เลือกหัวข้อ"),
  label: z.string().trim().max(60).optional(),
  totalQuestions: z.coerce
    .number()
    .int("จำนวนข้อต้องเป็นจำนวนเต็ม")
    .min(1, "อย่างน้อย 1 ข้อ")
    .max(500, "มากเกินไป"),
});

export const setInputSchema = z.object({
  name: z.string().trim().min(1, "ตั้งชื่อชุด").max(80),
  parts: z.array(partInputSchema).min(1, "ต้องมีอย่างน้อย 1 part"),
});

export const createSessionSchema = z.object({
  title: z.string().trim().min(1, "ตั้งชื่อ Mock Test").max(120),
  eventDate: z.string().min(1, "เลือกวันที่"),
  note: z.string().trim().max(500).optional(),
  bonusWeight: z.coerce.number().min(0).max(1).default(0.15),
  sets: z.array(setInputSchema).min(1, "ต้องมีอย่างน้อย 1 ชุด"),
});

export type CreateSessionInput = z.infer<typeof createSessionSchema>;

/// A single score row submitted by a user for one part.
export const scoreInputSchema = z
  .object({
    partId: z.string().min(1),
    totalQuestions: z.coerce.number().int().min(1),
    questionsAttempted: z.coerce.number().int().min(0),
    scoreGot: z.coerce.number().int().min(0),
  })
  .refine((d) => d.questionsAttempted <= d.totalQuestions, {
    message: "ข้อที่ทำต้องไม่เกินจำนวนข้อทั้งหมด",
    path: ["questionsAttempted"],
  })
  .refine((d) => d.scoreGot <= d.questionsAttempted, {
    message: "คะแนนต้องไม่เกินข้อที่ทำ",
    path: ["scoreGot"],
  });

export const submitScoresSchema = z.object({
  sessionId: z.string().min(1),
  scores: z.array(scoreInputSchema),
});

/// Flatten a ZodError into { field: message } for simple form feedback.
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
