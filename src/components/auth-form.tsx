"use client";

import Link from "next/link";
import { useActionState } from "react";
import { register, login, type AuthState } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label, FieldError, Card, CardBody } from "@/components/ui/primitives";
import { Mascot } from "@/components/mascot";
import { cn } from "@/lib/utils";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const action = mode === "login" ? login : register;
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    action,
    undefined,
  );

  const isLogin = mode === "login";

  const theme = isLogin
    ? {
        badge: "ยินดีต้อนรับกลับ",
        badgeClass: "border-accent/30 bg-accent-soft text-accent",
        iconClass: "bg-accent text-bg shadow-[0_8px_28px_-10px_var(--color-accent)]",
        title: "เข้าสู่ระบบด้วย Callsign",
        subtitle: "ใช้ Callsign และรหัสผ่านของคุณ",
        submit: "เข้าสู่ระบบ",
      }
    : {
        badge: "บัญชีใหม่",
        badgeClass: "border-gold/30 bg-gold/15 text-gold",
        iconClass: "bg-gold text-bg shadow-[0_8px_28px_-10px_var(--color-gold)]",
        title: "ลงทะเบียน Callsign ใหม่",
        subtitle: "Callsign คือชื่อนิรนามที่ใช้ลงคะแนนและดูสถิติ",
        submit: "สร้าง Callsign",
      };

  return (
    <Card className="w-full max-w-sm">
      <CardBody className="space-y-5">
        <div className="flex flex-col items-center gap-2 text-center">
          <span
            className={cn(
              "inline-flex items-center rounded-full border px-3 py-0.5 text-xs font-medium uppercase tracking-wide",
              theme.badgeClass,
            )}
          >
            {theme.badge}
          </span>
          <div
            aria-hidden
            className={cn(
              "mt-1 grid h-12 w-12 place-items-center rounded-2xl",
              theme.iconClass,
            )}
          >
            <Mascot variant="mono" size={30} />
          </div>
          <h1 className="text-xl font-semibold">{theme.title}</h1>
          <p className="text-sm text-muted">{theme.subtitle}</p>
        </div>

        <form action={formAction} className="space-y-4">
          <div>
            <Label htmlFor="callsign">Callsign</Label>
            <Input
              id="callsign"
              name="callsign"
              autoComplete="username"
              autoCapitalize="none"
              placeholder="เช่น Maverick, TG-07"
              className="font-mono"
              required
            />
            <FieldError>{state?.errors?.callsign}</FieldError>
          </div>

          <div>
            <Label htmlFor="password">รหัสผ่าน</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete={isLogin ? "current-password" : "new-password"}
              placeholder="••••••••"
              required
            />
            <FieldError>{state?.errors?.password}</FieldError>
          </div>

          {state?.message ? (
            <p className="rounded-lg border border-bad/30 bg-bad/10 px-3 py-2 text-sm text-bad">
              {state.message}
            </p>
          ) : null}

          <Button
            type="submit"
            size="lg"
            className={cn(
              "w-full",
              !isLogin &&
                "bg-gold hover:bg-gold/90 shadow-[0_6px_24px_-8px_var(--color-gold)]",
            )}
            disabled={pending}
          >
            {pending ? "กำลังดำเนินการ…" : theme.submit}
          </Button>
        </form>

        {isLogin ? (
          <div className="space-y-2.5 border-t border-border pt-4 text-center">
            <p className="text-sm text-muted">ยังไม่มี Callsign?</p>
            <Link
              href="/register"
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-gold/40 bg-gold/10 text-sm font-semibold text-gold transition-colors hover:bg-gold/20"
            >
              <Mascot variant="mono" size={16} />
              ลงทะเบียน Callsign ใหม่
            </Link>
          </div>
        ) : (
          <p className="border-t border-border pt-4 text-center text-sm text-muted">
            มี Callsign แล้ว?{" "}
            <Link
              href="/login"
              className="font-semibold text-accent hover:underline"
            >
              เข้าสู่ระบบ
            </Link>
          </p>
        )}
      </CardBody>
    </Card>
  );
}
