import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/dal";
import { getSessionWithScores } from "@/lib/queries";
import {
  ScoreEntryGrid,
  type GridSet,
} from "@/components/score-entry-grid";
import { SessionOwnerControls } from "@/components/session-owner-controls";
import { Badge, PageHeader } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import type { Category } from "@/lib/topics";

export default async function SessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const data = await getSessionWithScores(id);
  if (!data) notFound();

  const { session, rows } = data;
  const isOwner = session.createdBy.id === user.id;

  const mine = new Map(
    rows.filter((r) => r.userId === user.id).map((r) => [r.partId, r]),
  );

  const gridSets: GridSet[] = session.sets.map((set) => ({
    id: set.id,
    name: set.name,
    parts: set.parts.map((p) => {
      const existing = mine.get(p.id);
      return {
        id: p.id,
        name: p.label || p.topic.name,
        category: p.topic.category as Category,
        totalQuestions: p.totalQuestions,
        existing: existing
          ? {
              scoreGot: existing.scoreGot,
              questionsAttempted: existing.questionsAttempted,
            }
          : null,
      };
    }),
  }));

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <PageHeader
        title={
          <span className="flex flex-wrap items-center gap-3">
            {session.title}
            {session.status === "OPEN" ? (
              <Badge tone="good">เปิดรับคะแนน</Badge>
            ) : session.status === "CLOSED" ? (
              <Badge tone="default">ปิดแล้ว</Badge>
            ) : (
              <Badge tone="warn">ฉบับร่าง</Badge>
            )}
          </span>
        }
        subtitle={
          <>
            {formatDate(session.eventDate)} · สร้างโดย {session.createdBy.callsign}
            {session.note ? ` · ${session.note}` : ""}
          </>
        }
        actions={
          <Link href={`/sessions/${session.id}/results`}>
            <Button variant="outline">ผล &amp; อันดับ</Button>
          </Link>
        }
      />

      {isOwner && (
        <SessionOwnerControls sessionId={session.id} status={session.status} />
      )}

      <ScoreEntryGrid
        sessionId={session.id}
        sets={gridSets}
        closed={session.status === "CLOSED"}
      />
    </div>
  );
}
