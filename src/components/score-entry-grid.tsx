"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { submitScores } from "@/actions/scores";
import { CATEGORY_COLOR, type Category } from "@/lib/topics";
import { scorePct } from "@/lib/stats";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardBody } from "@/components/ui/primitives";
import { pct, fmt, cn } from "@/lib/utils";

export type GridPart = {
  id: string;
  name: string;
  category: Category;
  totalQuestions: number;
  existing: { scoreGot: number; questionsAttempted: number } | null;
};
export type GridSet = { id: string; name: string; parts: GridPart[] };

type Entry = { score: string; attempted: string };

export function ScoreEntryGrid({
  sessionId,
  sets,
  closed,
}: {
  sessionId: string;
  sets: GridSet[];
  closed: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [entries, setEntries] = useState<Record<string, Entry>>(() => {
    const init: Record<string, Entry> = {};
    for (const set of sets) {
      for (const p of set.parts) {
        init[p.id] = {
          score: p.existing ? String(p.existing.scoreGot) : "",
          attempted: p.existing ? String(p.existing.questionsAttempted) : "",
        };
      }
    }
    return init;
  });

  function update(partId: string, patch: Partial<Entry>) {
    setSaved(false);
    setEntries((prev) => ({ ...prev, [partId]: { ...prev[partId], ...patch } }));
  }

  const allParts = useMemo(() => sets.flatMap((s) => s.parts), [sets]);

  // Per-part validation message (null = ok).
  function partError(p: GridPart): string | null {
    const e = entries[p.id];
    if (!e || (e.score === "" && e.attempted === "")) return null;
    const attempted = Number(e.attempted || 0);
    const score = Number(e.score || 0);
    if (attempted > p.totalQuestions) return `ทำได้ไม่เกิน ${p.totalQuestions}`;
    if (score > attempted) return "คะแนน > ข้อที่ทำ";
    return null;
  }

  const summary = useMemo(() => {
    let correct = 0;
    let total = 0;
    let filled = 0;
    for (const p of allParts) {
      const e = entries[p.id];
      if (e && e.attempted !== "") {
        correct += Number(e.score || 0);
        total += p.totalQuestions;
        filled += 1;
      }
    }
    return { correct, total, filled, pct: scorePct(correct, total) };
  }, [entries, allParts]);

  function submit() {
    setError(null);

    for (const p of allParts) {
      if (partError(p)) {
        setError("มีบาง part กรอกไม่ถูกต้อง ตรวจสอบช่องสีแดง");
        return;
      }
    }

    const scores = allParts
      .filter((p) => entries[p.id]?.attempted !== "")
      .map((p) => ({
        partId: p.id,
        totalQuestions: p.totalQuestions,
        questionsAttempted: Number(entries[p.id].attempted || 0),
        scoreGot: Number(entries[p.id].score || 0),
      }));

    if (scores.length === 0) {
      setError("ยังไม่ได้กรอกคะแนน part ใดเลย");
      return;
    }

    start(async () => {
      const res = await submitScores({ sessionId, scores });
      if (res.ok) {
        setSaved(true);
        router.refresh();
      } else {
        setError(res.message);
      }
    });
  }

  if (closed) {
    return (
      <Card>
        <CardBody className="text-sm text-muted">
          Mock Test นี้ปิดรับคะแนนแล้ว ดูผลได้ที่หน้า{" "}
          <Link
            href={`/sessions/${sessionId}/results`}
            className="text-accent hover:underline"
          >
            ผล &amp; อันดับ
          </Link>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      {sets.map((set) => (
        <Card key={set.id}>
          <CardBody className="space-y-3">
            <h3 className="font-semibold">{set.name}</h3>
            <div className="hidden grid-cols-[1fr_84px_84px_64px] gap-3 px-1 text-xs text-faint sm:grid">
              <span>หัวข้อ</span>
              <span className="text-center">คะแนน<span className="text-bad ml-0.5">*</span></span>
              <span className="text-center">ทำกี่ข้อ<span className="text-bad ml-0.5">*</span></span>
              <span className="text-center">ทั้งหมด</span>
            </div>
            <p className="hidden text-right text-xs text-faint sm:block"><span className="text-bad">*</span> ต้องกรอก</p>
            <div className="space-y-2">
              {set.parts.map((p) => {
                const err = partError(p);
                return (
                  <div key={p.id}>
                    <div className="grid grid-cols-[1fr_84px_84px_64px] items-center gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          aria-hidden
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ background: CATEGORY_COLOR[p.category] }}
                        />
                        <span className="truncate">{p.name}</span>
                      </div>
                      <Input
                        type="number"
                        inputMode="numeric"
                        min="0"
                        max={p.totalQuestions}
                        placeholder="–"
                        aria-label={`คะแนน ${p.name}`}
                        className={cn("tnum text-center", err && "border-bad")}
                        value={entries[p.id]?.score ?? ""}
                        onChange={(e) => update(p.id, { score: e.target.value })}
                      />
                      <Input
                        type="number"
                        inputMode="numeric"
                        min="0"
                        max={p.totalQuestions}
                        placeholder="–"
                        aria-label={`ข้อที่ทำ ${p.name}`}
                        className={cn("tnum text-center", err && "border-bad")}
                        value={entries[p.id]?.attempted ?? ""}
                        onChange={(e) => update(p.id, { attempted: e.target.value })}
                      />
                      <div className="grid h-10 place-items-center rounded-xl border border-border bg-bg/40 text-sm text-muted tnum">
                        {p.totalQuestions}
                      </div>
                    </div>
                    {err && <p className="mt-1 pl-5 text-xs text-bad">{err}</p>}
                  </div>
                );
              })}
            </div>
          </CardBody>
        </Card>
      ))}

      {/* Sticky submit bar with running totals */}
      <div className="sticky bottom-3 z-10">
        <Card className="border-border-strong bg-surface/90 shadow-lg backdrop-blur-md">
          <CardBody className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <div className="text-sm">
              <span className="text-faint">รวม </span>
              <span className="tnum font-semibold">{fmt(summary.correct, 0)}</span>
              <span className="text-faint"> / {fmt(summary.total, 0)} ข้อ</span>
              <span className="ml-2 text-accent tnum">{pct(summary.pct)}</span>
            </div>
            <div className="text-sm text-faint">
              กรอกแล้ว {summary.filled} part
            </div>
            <div className="ml-auto flex items-center gap-3">
              {saved && !error && (
                <span className="text-sm text-good">บันทึกแล้ว ✓</span>
              )}
              {error && <span className="text-sm text-bad">{error}</span>}
              <Link href={`/sessions/${sessionId}/results`}>
                <Button variant="outline" size="sm">
                  ดูผล
                </Button>
              </Link>
              <Button onClick={submit} disabled={pending}>
                {pending ? "กำลังบันทึก…" : "บันทึกคะแนน"}
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>

      <p className="px-1 text-xs text-faint">
        เว้นว่าง part ที่ไม่ได้ทำได้ · จุดสีหน้าหัวข้อบอกหมวด · บันทึกซ้ำได้จนกว่าจะปิดรับคะแนน
      </p>
    </div>
  );
}
