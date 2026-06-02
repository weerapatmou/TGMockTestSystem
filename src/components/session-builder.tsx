"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createSession } from "@/actions/sessions";
import { CATEGORIES, CATEGORY_LABEL, type Category } from "@/lib/topics";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Label, Card, CardBody, FieldError } from "@/components/ui/primitives";

type Topic = { id: string; name: string; category: Category };
type Template = {
  id: string;
  title: string;
  bonusWeight: number;
  sets: {
    name: string;
    parts: { topicId: string; label: string | null; totalQuestions: number }[];
  }[];
};

type PartDraft = { key: string; topicId: string; label: string; totalQuestions: string };
type SetDraft = { key: string; name: string; parts: PartDraft[] };

let counter = 0;
const uid = () => `k${counter++}`;

function newPart(topicId = ""): PartDraft {
  return { key: uid(), topicId, label: "", totalQuestions: "20" };
}
function newSet(name: string, parts?: PartDraft[]): SetDraft {
  return { key: uid(), name, parts: parts ?? [newPart()] };
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

export function SessionBuilder({
  topics,
  templates,
}: {
  topics: Topic[];
  templates: Template[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [eventDate, setEventDate] = useState(today());
  const [note, setNote] = useState("");
  const [bonusWeight, setBonusWeight] = useState("0.15");
  const [sets, setSets] = useState<SetDraft[]>([newSet("ชุดที่ 1")]);

  const topicsByCat = useMemo(() => {
    const map = new Map<Category, Topic[]>();
    for (const c of CATEGORIES) map.set(c, []);
    for (const t of topics) map.get(t.category)?.push(t);
    return map;
  }, [topics]);

  function applyTemplate(id: string) {
    const tpl = templates.find((t) => t.id === id);
    if (!tpl) return;
    setBonusWeight(String(tpl.bonusWeight));
    setSets(
      tpl.sets.map((s) =>
        newSet(
          s.name,
          s.parts.map((p) => ({
            key: uid(),
            topicId: p.topicId,
            label: p.label ?? "",
            totalQuestions: String(p.totalQuestions),
          })),
        ),
      ),
    );
  }

  function mutateSet(idx: number, fn: (s: SetDraft) => SetDraft) {
    setSets((prev) => prev.map((s, i) => (i === idx ? fn(s) : s)));
  }

  const totalParts = sets.reduce((a, s) => a + s.parts.length, 0);
  const totalQuestions = sets.reduce(
    (a, s) => a + s.parts.reduce((b, p) => b + (Number(p.totalQuestions) || 0), 0),
    0,
  );

  function submit() {
    setError(null);
    const input = {
      title,
      eventDate,
      note,
      bonusWeight: Number(bonusWeight),
      sets: sets.map((s) => ({
        name: s.name,
        parts: s.parts.map((p) => ({
          topicId: p.topicId,
          label: p.label || undefined,
          totalQuestions: Number(p.totalQuestions),
        })),
      })),
    };
    start(async () => {
      const res = await createSession(input);
      if (res.ok) {
        router.push(`/sessions/${res.id}`);
      } else {
        const firstErr = res.errors ? Object.values(res.errors)[0] : undefined;
        setError(res.message ?? firstErr ?? "บันทึกไม่สำเร็จ ตรวจสอบข้อมูลอีกครั้ง");
      }
    });
  }

  return (
    <div className="space-y-6">
      {templates.length > 0 && (
        <Card>
          <CardBody className="flex flex-wrap items-center gap-3">
            <span className="text-sm text-muted">เริ่มจากของเดิม:</span>
            <Select
              className="max-w-xs"
              defaultValue=""
              onChange={(e) => e.target.value && applyTemplate(e.target.value)}
            >
              <option value="">Clone จาก Mock Test ก่อนหน้า…</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </Select>
          </CardBody>
        </Card>
      )}

      <Card>
        <CardBody className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="title">ชื่อ Mock Test</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="เช่น 6th Mock Test"
            />
          </div>
          <div>
            <Label htmlFor="date">วันที่</Label>
            <Input
              id="date"
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="bonus">น้ำหนักโบนัสความแม่น (0–1)</Label>
            <Input
              id="bonus"
              type="number"
              step="0.05"
              min="0"
              max="1"
              value={bonusWeight}
              onChange={(e) => setBonusWeight(e.target.value)}
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="note">หมายเหตุ (ไม่บังคับ)</Label>
            <Input
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="รายละเอียดเพิ่มเติม"
            />
          </div>
        </CardBody>
      </Card>

      {sets.map((set, si) => (
        <Card key={set.key}>
          <CardBody className="space-y-4">
            <div className="flex items-center gap-3">
              <Input
                value={set.name}
                onChange={(e) =>
                  mutateSet(si, (s) => ({ ...s, name: e.target.value }))
                }
                className="max-w-xs font-medium"
                placeholder="ชื่อชุด"
              />
              {sets.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-auto text-bad"
                  onClick={() => setSets((p) => p.filter((_, i) => i !== si))}
                >
                  ลบชุด
                </Button>
              )}
            </div>

            <div className="space-y-2">
              <div className="hidden grid-cols-[1fr_minmax(0,1fr)_90px_36px] gap-2 px-1 text-xs text-faint sm:grid">
                <span>หัวข้อ</span>
                <span>ชื่อที่จะแสดง (ไม่บังคับ)</span>
                <span>จำนวนข้อ</span>
                <span />
              </div>
              {set.parts.map((part, pi) => (
                <div
                  key={part.key}
                  className="grid grid-cols-2 gap-2 sm:grid-cols-[1fr_minmax(0,1fr)_90px_36px]"
                >
                  <Select
                    value={part.topicId}
                    onChange={(e) =>
                      mutateSet(si, (s) => ({
                        ...s,
                        parts: s.parts.map((p, i) =>
                          i === pi ? { ...p, topicId: e.target.value } : p,
                        ),
                      }))
                    }
                  >
                    <option value="">เลือกหัวข้อ…</option>
                    {CATEGORIES.map((cat) => (
                      <optgroup key={cat} label={CATEGORY_LABEL[cat]}>
                        {(topicsByCat.get(cat) ?? []).map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </Select>
                  <Input
                    value={part.label}
                    placeholder="(ตามชื่อหัวข้อ)"
                    onChange={(e) =>
                      mutateSet(si, (s) => ({
                        ...s,
                        parts: s.parts.map((p, i) =>
                          i === pi ? { ...p, label: e.target.value } : p,
                        ),
                      }))
                    }
                  />
                  <Input
                    type="number"
                    inputMode="numeric"
                    min="1"
                    value={part.totalQuestions}
                    className="tnum"
                    onChange={(e) =>
                      mutateSet(si, (s) => ({
                        ...s,
                        parts: s.parts.map((p, i) =>
                          i === pi ? { ...p, totalQuestions: e.target.value } : p,
                        ),
                      }))
                    }
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-faint hover:text-bad"
                    aria-label="ลบ part"
                    onClick={() =>
                      mutateSet(si, (s) => ({
                        ...s,
                        parts:
                          s.parts.length > 1
                            ? s.parts.filter((_, i) => i !== pi)
                            : s.parts,
                      }))
                    }
                  >
                    ✕
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  mutateSet(si, (s) => ({ ...s, parts: [...s.parts, newPart()] }))
                }
              >
                + เพิ่ม part
              </Button>
            </div>
          </CardBody>
        </Card>
      ))}

      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="secondary"
          onClick={() => setSets((p) => [...p, newSet(`ชุดที่ ${p.length + 1}`)])}
        >
          + เพิ่มชุด
        </Button>
        <span className="text-sm text-muted">
          {sets.length} ชุด · {totalParts} parts ·{" "}
          <span className="tnum">{totalQuestions}</span> ข้อรวม
        </span>
        <Link
          href="/settings/topics"
          className="ml-auto text-sm text-muted hover:text-foreground"
        >
          จัดการหัวข้อ →
        </Link>
      </div>

      {error && (
        <FieldError>{error}</FieldError>
      )}

      <div className="flex justify-end gap-2 border-t border-border pt-4">
        <Button variant="ghost" onClick={() => router.push("/")}>
          ยกเลิก
        </Button>
        <Button size="lg" onClick={submit} disabled={pending}>
          {pending ? "กำลังสร้าง…" : "สร้าง Mock Test"}
        </Button>
      </div>
    </div>
  );
}
