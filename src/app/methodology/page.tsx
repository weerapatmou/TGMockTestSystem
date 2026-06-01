import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardBody, PageHeader, Badge } from "@/components/ui/primitives";
import { DEFAULT_BONUS_WEIGHT } from "@/lib/stats";

const bonusPct = Math.round(DEFAULT_BONUS_WEIGHT * 100);
const basePct = 100 - bonusPct;

/// A formula displayed in mono with a plain-language gloss underneath.
function Formula({
  expr,
  note,
}: {
  expr: React.ReactNode;
  note: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-bg-elevated p-4">
      <code className="block font-mono text-sm leading-relaxed text-foreground sm:text-base">
        {expr}
      </code>
      <p className="mt-2 text-sm text-muted">{note}</p>
    </div>
  );
}

export default function MethodologyPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-8">
      <PageHeader
        title="วิธีคิดคะแนน"
        subtitle="Score%, Accuracy% และ Combined Index คำนวณมายังไง"
        actions={
          <Link href="/me">
            <Button variant="outline">ไปดูสถิติของฉัน</Button>
          </Link>
        }
      />

      {/* Score% */}
      <Card>
        <CardBody className="space-y-3">
          <div className="flex items-center gap-2">
            <Badge tone="default">Score %</Badge>
            <h2 className="font-semibold">ทำถูกกี่ % ของข้อสอบทั้งชุด</h2>
          </div>
          <Formula
            expr={
              <>
                Score% = ( ข้อที่ตอบถูก ÷ <span className="text-accent">ข้อทั้งหมด</span> ) × 100
              </>
            }
            note={
              <>
                ดูภาพรวมว่าทำได้กี่เปอร์เซ็นต์ของข้อสอบทั้งหมด —{" "}
                <span className="text-foreground">ข้อที่เว้นไว้ไม่ตอบนับเป็นพลาด</span>{" "}
                เพราะหารด้วยจำนวนข้อเต็ม
              </>
            }
          />
        </CardBody>
      </Card>

      {/* Accuracy% */}
      <Card>
        <CardBody className="space-y-3">
          <div className="flex items-center gap-2">
            <Badge tone="good">Accuracy %</Badge>
            <h2 className="font-semibold">เฉพาะข้อที่ตอบ แม่นแค่ไหน</h2>
          </div>
          <Formula
            expr={
              <>
                Accuracy% = ( ข้อที่ตอบถูก ÷ <span className="text-good">ข้อที่ตอบ</span> ) × 100
              </>
            }
            note={
              <>
                วัดความแม่นยำเฉพาะข้อที่ลงมือตอบ{" "}
                <span className="text-foreground">ไม่สนใจข้อที่เว้นไว้</span> —
                คนที่เลือกตอบเฉพาะข้อที่มั่นใจมักได้ Accuracy สูง
              </>
            }
          />
        </CardBody>
      </Card>

      {/* Combined Index */}
      <Card>
        <CardBody className="space-y-3">
          <div className="flex items-center gap-2">
            <Badge tone="accent">Combined Index</Badge>
            <h2 className="font-semibold">ตัวเลขที่ใช้จัดอันดับ</h2>
          </div>
          <Formula
            expr={
              <>
                Combined = {basePct}% × <span className="text-accent">Score%</span> +{" "}
                {bonusPct}% × <span className="text-good">Accuracy%</span>
              </>
            }
            note={
              <>
                เอา Score% เป็นหลัก ({basePct}%) แล้วบวก{" "}
                <span className="text-foreground">โบนัสความแม่น</span> อีก {bonusPct}%
                เพื่อให้เครดิตคนที่ตอบแม่น ไม่ใช่เดามั่ว ค่าโบนัสนี้ตั้งได้แยกในแต่ละ Mock Test
                (ค่าเริ่มต้น {bonusPct}%)
              </>
            }
          />
        </CardBody>
      </Card>

      {/* Worked example */}
      <Card>
        <CardBody className="space-y-4">
          <h2 className="font-semibold">ลองคิดเป็นตัวอย่าง</h2>
          <p className="text-sm text-muted">
            สมมติข้อสอบ <span className="font-mono text-foreground">60</span> ข้อ คุณตอบ{" "}
            <span className="font-mono text-foreground">50</span> ข้อ และทำถูก{" "}
            <span className="font-mono text-foreground">40</span> ข้อ
          </p>
          <div className="space-y-2 font-mono text-sm">
            <div className="flex flex-wrap items-baseline justify-between gap-2 rounded-lg bg-bg-elevated px-3 py-2">
              <span className="text-muted">Score% = 40 ÷ 60 × 100</span>
              <span className="font-semibold text-foreground">= 66.7%</span>
            </div>
            <div className="flex flex-wrap items-baseline justify-between gap-2 rounded-lg bg-bg-elevated px-3 py-2">
              <span className="text-muted">Accuracy% = 40 ÷ 50 × 100</span>
              <span className="font-semibold text-good">= 80.0%</span>
            </div>
            <div className="flex flex-wrap items-baseline justify-between gap-2 rounded-lg border border-accent/30 bg-accent-soft px-3 py-2">
              <span className="text-muted">
                Combined = {basePct}%×66.7 + {bonusPct}%×80.0
              </span>
              <span className="font-semibold text-accent">= 68.7</span>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Ranking */}
      <Card>
        <CardBody className="space-y-2">
          <h2 className="font-semibold">การจัดอันดับ</h2>
          <ul className="list-disc space-y-1.5 pl-5 text-sm text-muted">
            <li>เรียงจาก Combined Index มากไปน้อย</li>
            <li>
              ถ้า Combined เท่ากัน ใช้{" "}
              <span className="text-foreground">จำนวนข้อที่ตอบถูกรวม</span> มาตัดสิน
            </li>
            <li>คนที่ได้ Combined เท่ากันจริง ๆ จะได้อันดับเดียวกัน (อันดับเสมอ)</li>
          </ul>
        </CardBody>
      </Card>
    </div>
  );
}
