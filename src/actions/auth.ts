"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { createSession, deleteSession } from "@/lib/session";
import { registerSchema, loginSchema, fieldErrors } from "@/lib/validation";

export type AuthState = {
  errors?: Record<string, string>;
  message?: string;
} | undefined;

export async function register(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = registerSchema.safeParse({
    callsign: formData.get("callsign"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { errors: fieldErrors(parsed.error) };
  }

  const { callsign, password } = parsed.data;
  const callsignNorm = callsign.toLowerCase();

  const existing = await prisma.user.findUnique({ where: { callsignNorm } });
  if (existing) {
    return { errors: { callsign: "Callsign นี้มีคนใช้แล้ว" } };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { callsign, callsignNorm, passwordHash },
    select: { id: true, callsign: true },
  });

  await createSession({ userId: user.id, callsign: user.callsign });
  redirect("/");
}

export async function login(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = loginSchema.safeParse({
    callsign: formData.get("callsign"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { errors: fieldErrors(parsed.error) };
  }

  const { callsign, password } = parsed.data;
  const user = await prisma.user.findUnique({
    where: { callsignNorm: callsign.toLowerCase() },
  });

  // Constant-ish failure message to avoid leaking which callsigns exist.
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return { message: "Callsign หรือรหัสผ่านไม่ถูกต้อง" };
  }

  await createSession({ userId: user.id, callsign: user.callsign });
  redirect("/");
}

export async function logout() {
  await deleteSession();
  redirect("/login");
}
