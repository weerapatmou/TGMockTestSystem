import Link from "next/link";
import { requireUser } from "@/lib/dal";
import { getUserScoreHistory } from "@/lib/queries";
import {
  breakdownByCategory,
  combinedIndex,
  scorePct,
  accuracyPct,
  type ScoreRow,
} from "@/lib/stats";
import { CATEGORIES, CATEGORY_LABEL } from "@/lib/topics";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardBody,
  PageHeader,
  Stat,
  EmptyState,
} from "@/components/ui/primitives";
import { CategoryRadar, type RadarDatum } from "@/components/charts/category-radar";
import { TrendLine, type TrendDatum } from "@/components/charts/trend-line";
import { fmt, pct, formatDate } from "@/lib/utils";

export default async function MePage() {
  const user = await requireUser();
  const history = await getUserScoreHistory(user.id);

  if (history.length === 0) {
    return (
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
        <PageHeader title="สถิติของฉัน" subtitle={user.callsign} />
        <EmptyState
          title="ยังไม่มีคะแนน"
          description="เมื่อคุณกรอกคะแนน Mock Test สถิติและแนวโน้มของคุณจะมาแสดงที่นี่"
          action={
            <Link href="/">
              <Button>ไปหน้าหลัก</Button>
            </Link>
          }
        />
      </div>
    );
  }

  const allRows: ScoreRow[] = history.map((h) => h.row);

  // Per-session aggregation → trend (chronological).
  type Agg = {
    sessionId: string;
    title: string;
    eventDate: Date;
    weight: number;
    correct: number;
    attempted: number;
    total: number;
  };
  const bySession = new Map<string, Agg>();
  for (const h of history) {
    let a = bySession.get(h.sessionId);
    if (!a) {
      a = {
        sessionId: h.sessionId,
        title: h.sessionTitle,
        eventDate: h.eventDate,
        weight: h.bonusWeight,
        correct: 0,
        attempted: 0,
        total: 0,
      };
      bySession.set(h.sessionId, a);
    }
    a.correct += h.row.scoreGot;
    a.attempted += h.row.questionsAttempted;
    a.total += h.row.totalQuestions;
  }
  const sessions = [...bySession.values()].sort(
    (a, b) => a.eventDate.getTime() - b.eventDate.getTime(),
  );
  const trend: TrendDatum[] = sessions.map((s) => {
    const sPct = scorePct(s.correct, s.total);
    const aPct = accuracyPct(s.correct, s.attempted);
    return {
      label: formatDate(s.eventDate),
      combined: Number(combinedIndex(sPct, aPct, s.weight).toFixed(1)),
      scorePct: Number(sPct.toFixed(1)),
    };
  });

  const bestCombined = Math.max(...trend.map((t) => t.combined));
  const avgCombined =
    trend.reduce((a, t) => a + t.combined, 0) / trend.length;

  // Overall accuracy across all history (correct ÷ attempted).
  const totalCorrect = allRows.reduce((a, r) => a + r.scoreGot, 0);
  const totalAttempted = allRows.reduce((a, r) => a + r.questionsAttempted, 0);
  const overallAccuracy = accuracyPct(totalCorrect, totalAttempted);

  // Category radar (my history overall).
  const myCat = new Map(breakdownByCategory(allRows).map((c) => [c.category, c]));
  const usedCats = CATEGORIES.filter((c) => myCat.has(c));
  const radarData: RadarDatum[] = usedCats.map((c) => ({
    category: CATEGORY_LABEL[c],
    me: Number((myCat.get(c)?.scorePct ?? 0).toFixed(1)),
    group: 0,
  }));

  // Weakest topics across all history (by Score%).
  const byTopic = new Map<string, { correct: number; total: number }>();
  for (const h of history) {
    const t = byTopic.get(h.topicName) ?? { correct: 0, total: 0 };
    t.correct += h.row.scoreGot;
    t.total += h.row.totalQuestions;
    byTopic.set(h.topicName, t);
  }
  const topics = [...byTopic.entries()]
    .map(([name, v]) => ({ name, pct: scorePct(v.correct, v.total), total: v.total }))
    .filter((t) => t.total > 0)
    .sort((a, b) => a.pct - b.pct);
  const weakest = topics.slice(0, 6);

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8">
      <PageHeader
        title="สถิติของฉัน"
        subtitle={
          <>
            <span className="font-mono text-accent">{user.callsign}</span> ·{" "}
            ร่วม {sessions.length} Mock Test
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <Stat label="Mock Test ที่ร่วม" value={fmt(sessions.length, 0)} />
        <Stat label="Combined เฉลี่ย" value={fmt(avgCombined)} tone="accent" />
        <Stat label="Combined ดีที่สุด" value={fmt(bestCombined)} tone="good" />
        <Stat
          label="Accuracy %"
          value={pct(overallAccuracy)}
          sub={`ถูก ${fmt(totalCorrect, 0)}/${fmt(totalAttempted, 0)} ที่ตอบ`}
          tone="good"
        />
        <Stat
          label="หมวดที่อ่อนสุด"
          value={
            radarData.length
              ? [...radarData].sort((a, b) => a.me - b.me)[0].category
              : "–"
          }
          tone="warn"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardBody className="space-y-2">
            <h2 className="font-semibold">แนวโน้มข้ามสัปดาห์</h2>
            <p className="text-xs text-faint">Combined Index และ Score% ต่อ Mock Test</p>
            <TrendLine data={trend} />
          </CardBody>
        </Card>
        <Card>
          <CardBody className="space-y-2">
            <h2 className="font-semibold">จุดแข็ง / จุดอ่อนรายหมวด</h2>
            <p className="text-xs text-faint">Score% สะสมของฉันแต่ละหมวด</p>
            <CategoryRadar data={radarData} showGroup={false} />
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardBody className="space-y-3">
          <h2 className="font-semibold">หัวข้อที่ควรพัฒนา</h2>
          <p className="text-xs text-faint">เรียงจาก Score% สะสมต่ำสุด</p>
          <div className="space-y-2">
            {weakest.map((t) => (
              <div key={t.name} className="flex items-center gap-3">
                <span className="w-40 shrink-0 truncate text-sm">{t.name}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-2">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min(t.pct, 100)}%`,
                      background:
                        t.pct < 50
                          ? "var(--color-bad)"
                          : t.pct < 70
                            ? "var(--color-warn)"
                            : "var(--color-good)",
                    }}
                  />
                </div>
                <span className="w-14 shrink-0 text-right text-sm tnum">
                  {pct(t.pct)}
                </span>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
