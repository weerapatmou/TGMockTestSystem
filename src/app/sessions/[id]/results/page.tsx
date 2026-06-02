import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/dal";
import { getSessionWithScores } from "@/lib/queries";
import {
  buildLeaderboard,
  statsByPart,
  breakdownByCategory,
  scorePct,
  accuracyPct,
} from "@/lib/stats";
import { CATEGORIES, CATEGORY_LABEL, type Category } from "@/lib/topics";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardBody,
  PageHeader,
  Stat,
  EmptyState,
  Badge,
} from "@/components/ui/primitives";
import { CategoryRadar, type RadarDatum } from "@/components/charts/category-radar";
import { PartBar, type PartBarDatum } from "@/components/charts/part-bar";
import { fmt, pct, formatDate, cn } from "@/lib/utils";

export default async function ResultsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const data = await getSessionWithScores(id);
  if (!data) notFound();

  const { session, rows } = data;
  const weight = session.bonusWeight;

  const header = (
    <PageHeader
      title={<>ผล &amp; อันดับ · {session.title}</>}
      subtitle={`${formatDate(session.eventDate)} · ${rows.length === 0 ? "ยังไม่มีคะแนน" : ""}`}
      actions={
        <Link href={`/sessions/${session.id}`}>
          <Button variant="outline">กรอก/แก้คะแนนของฉัน</Button>
        </Link>
      }
    />
  );

  if (rows.length === 0) {
    return (
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
        {header}
        <EmptyState
          title="ยังไม่มีใครลงคะแนน"
          description="เป็นคนแรกที่กรอกคะแนนของ Mock Test นี้"
          action={
            <Link href={`/sessions/${session.id}`}>
              <Button>กรอกคะแนน</Button>
            </Link>
          }
        />
      </div>
    );
  }

  const leaderboard = buildLeaderboard(rows, weight);
  const me = leaderboard.find((u) => u.userId === user.id);
  const myRows = rows.filter((r) => r.userId === user.id);

  // Category radar: me vs group, only for categories used in this session.
  const groupCat = new Map(
    breakdownByCategory(rows).map((c) => [c.category, c]),
  );
  const myCat = new Map(breakdownByCategory(myRows).map((c) => [c.category, c]));
  const usedCategories = CATEGORIES.filter((c) => groupCat.has(c));
  const radarData: RadarDatum[] = usedCategories.map((c) => ({
    category: CATEGORY_LABEL[c],
    group: Number((groupCat.get(c)?.scorePct ?? 0).toFixed(1)),
    me: Number((myCat.get(c)?.scorePct ?? 0).toFixed(1)),
  }));

  // Per-part stats + bar data (in session order).
  const partStats = statsByPart(rows);
  const myByPart = new Map(myRows.map((r) => [r.partId, r]));
  const orderedParts = session.sets.flatMap((set) =>
    set.parts.map((p) => ({
      id: p.id,
      name: p.label || p.topic.name,
      category: p.topic.category as Category,
      setName: set.name,
      totalQuestions: p.totalQuestions,
    })),
  );
  const partBarData: PartBarDatum[] = orderedParts.map((p) => {
    const st = partStats.get(p.id);
    const mine = myByPart.get(p.id);
    return {
      name: p.name,
      group: Number((st?.scorePctStat.avg ?? 0).toFixed(1)),
      me: mine ? Number(scorePct(mine.scoreGot, mine.totalQuestions).toFixed(1)) : null,
    };
  });

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8">
      {header}

      {/* My summary */}
      {me ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="อันดับของฉัน" value={`#${me.rank}`} sub={`จาก ${leaderboard.length} คน`} tone="accent" />
          <Stat label="Combined Index" value={fmt(me.combined)} tone="accent" />
          <Stat label="Score %" value={pct(me.scorePct)} sub={`${fmt(me.totalCorrect, 0)}/${fmt(me.totalQuestions, 0)} ข้อ`} />
          <Stat label="Accuracy %" value={pct(me.accuracyPct)} sub={`ทำ ${fmt(me.totalAttempted, 0)} ข้อ`} />
        </div>
      ) : (
        <Card>
          <CardBody className="text-sm text-muted">
            คุณยังไม่ได้กรอกคะแนนของ Mock Test นี้ ·{" "}
            <Link href={`/sessions/${session.id}`} className="text-accent hover:underline">
              กรอกเลย
            </Link>
          </CardBody>
        </Card>
      )}

      {/* Leaderboard */}
      <Card>
        <CardBody className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Leaderboard</h2>
            <span className="text-xs text-faint">
              จัดอันดับด้วย Combined Index (โบนัสความแม่น {Math.round(weight * 100)}%)
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-faint">
                  <th className="py-2 pr-2 font-medium">#</th>
                  <th className="py-2 pr-2 font-medium">Callsign</th>
                  <th className="py-2 pr-2 text-right font-medium">Combined</th>
                  <th className="py-2 pr-2 text-right font-medium">Score%</th>
                  <th className="py-2 pr-2 text-right font-medium">Acc%</th>
                  <th className="py-2 text-right font-medium">คะแนนดิบ</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((u) => {
                  const isMe = u.userId === user.id;
                  return (
                    <tr
                      key={u.userId}
                      className={cn(
                        "border-b border-border/60",
                        isMe && "bg-accent-soft",
                      )}
                    >
                      <td className="py-2 pr-2 tnum">
                        {u.rank <= 3 ? (
                          <span className="text-gold">●</span>
                        ) : null}{" "}
                        {u.rank}
                      </td>
                      <td className="py-2 pr-2 font-mono">
                        {u.callsign}
                        {isMe && (
                          <Badge tone="accent" className="ml-2">
                            ฉัน
                          </Badge>
                        )}
                      </td>
                      <td className="py-2 pr-2 text-right font-semibold tnum text-accent">
                        {fmt(u.combined)}
                      </td>
                      <td className="py-2 pr-2 text-right tnum">{pct(u.scorePct)}</td>
                      <td className="py-2 pr-2 text-right tnum text-muted">
                        {pct(u.accuracyPct)}
                      </td>
                      <td className="py-2 text-right tnum text-muted">
                        {fmt(u.totalCorrect, 0)}/{fmt(u.totalQuestions, 0)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardBody className="space-y-2">
            <h2 className="font-semibold">จุดแข็ง / จุดอ่อนรายหมวด</h2>
            <p className="text-xs text-faint">Score% ของฉันเทียบค่าเฉลี่ยกลุ่ม</p>
            <CategoryRadar data={radarData} showMe={!!me} />
          </CardBody>
        </Card>
        <Card>
          <CardBody className="space-y-2">
            <h2 className="font-semibold">คะแนนรายหัวข้อ (Score%)</h2>
            <p className="text-xs text-faint">ฉันเทียบค่าเฉลี่ยกลุ่ม</p>
            <PartBar data={partBarData} />
          </CardBody>
        </Card>
      </div>

      {/* Per-part avg/min/max */}
      <Card>
        <CardBody className="space-y-3">
          <h2 className="font-semibold">สถิติรายหัวข้อ (คะแนนดิบ)</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-faint">
                  <th className="py-2 pr-2 font-medium">หัวข้อ</th>
                  <th className="py-2 pr-2 text-right font-medium">เฉลี่ย</th>
                  <th className="py-2 pr-2 text-right font-medium">ต่ำสุด</th>
                  <th className="py-2 pr-2 text-right font-medium">สูงสุด</th>
                  <th className="py-2 pr-2 text-right font-medium">ของฉัน</th>
                  <th className="py-2 pr-2 text-right font-medium">เต็ม</th>
                  <th className="py-2 pr-2 text-right font-medium">%score</th>
                  <th className="py-2 text-right font-medium">%acc</th>
                </tr>
              </thead>
              <tbody>
                {orderedParts.map((p) => {
                  const st = partStats.get(p.id);
                  const mine = myByPart.get(p.id);
                  return (
                    <tr key={p.id} className="border-b border-border/60">
                      <td className="py-2 pr-2">{p.name}</td>
                      <td className="py-2 pr-2 text-right tnum">
                        {st ? fmt(st.scoreGot.avg) : "–"}
                      </td>
                      <td className="py-2 pr-2 text-right tnum text-muted">
                        {st ? fmt(st.scoreGot.min, 0) : "–"}
                      </td>
                      <td className="py-2 pr-2 text-right tnum text-muted">
                        {st ? fmt(st.scoreGot.max, 0) : "–"}
                      </td>
                      <td className="py-2 pr-2 text-right tnum font-medium text-accent">
                        {mine ? fmt(mine.scoreGot, 0) : "–"}
                      </td>
                      <td className="py-2 pr-2 text-right tnum text-faint">
                        {p.totalQuestions}
                      </td>
                      <td className="py-2 pr-2 text-right tnum text-muted">
                        {mine ? pct(scorePct(mine.scoreGot, mine.totalQuestions)) : "–"}
                      </td>
                      <td className="py-2 text-right tnum text-muted">
                        {mine ? pct(accuracyPct(mine.scoreGot, mine.questionsAttempted)) : "–"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
