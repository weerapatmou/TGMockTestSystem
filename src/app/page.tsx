import Link from "next/link";
import { requireUser } from "@/lib/dal";
import { getSessionsForDashboard } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import {
  Badge,
  Card,
  CardBody,
  EmptyState,
  PageHeader,
} from "@/components/ui/primitives";
import { formatDate } from "@/lib/utils";
import { DeleteSessionButton } from "@/components/delete-session-button";
import { SessionStatusToggle } from "@/components/session-status-toggle";
import { Mascot } from "@/components/mascot";

function StatusBadge({ status }: { status: "DRAFT" | "OPEN" | "CLOSED" }) {
  if (status === "OPEN") return <Badge tone="good">เปิดรับคะแนน</Badge>;
  if (status === "CLOSED") return <Badge tone="default">ปิดแล้ว</Badge>;
  return <Badge tone="warn">ฉบับร่าง</Badge>;
}

export default async function DashboardPage() {
  const user = await requireUser();
  const sessions = await getSessionsForDashboard();

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8">
      <PageHeader
        title={
          <span className="inline-flex items-center gap-2">
            สวัสดี <span className="text-accent">{user.callsign}</span>
            <Mascot size={32} className="inline-block align-[-0.2em]" />
          </span>
        }
        subtitle="เลือก Mock Test เพื่อกรอกคะแนน หรือดูผลและอันดับ"
        actions={
          <Link href="/sessions/new">
            <Button>+ สร้าง Mock Test</Button>
          </Link>
        }
      />

      {sessions.length === 0 ? (
        <EmptyState
          title="ยังไม่มี Mock Test"
          description="เริ่มต้นด้วยการสร้าง Mock Test แรกตามหัวข้อที่หัวหน้ากลุ่มกำหนด"
          action={
            <Link href="/sessions/new">
              <Button>สร้าง Mock Test แรก</Button>
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {sessions.map((s) => (
            <Card
              key={s.id}
              className="group flex flex-col transition-colors hover:border-border-strong"
            >
              <CardBody className="flex flex-1 flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-xs text-faint">{formatDate(s.eventDate)}</div>
                    <h3 className="mt-0.5 text-lg font-semibold leading-tight">
                      {s.title}
                    </h3>
                  </div>
                  <StatusBadge status={s.status} />
                </div>

                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
                  <span>{s.setCount} ชุด</span>
                  <span>{s.partCount} parts</span>
                  <span className="tnum">{s.totalQuestions} ข้อ</span>
                  <span className="tnum">{s.participants} คนลงแล้ว</span>
                </div>

                <div className="mt-auto flex items-center gap-2 pt-2">
                  <Link href={`/sessions/${s.id}`} className="flex-1">
                    <Button
                      variant={s.status === "OPEN" ? "primary" : "secondary"}
                      size="sm"
                      className="w-full"
                    >
                      {s.status === "OPEN" ? "กรอกคะแนน" : "ดูรายละเอียด"}
                    </Button>
                  </Link>
                  <Link href={`/sessions/${s.id}/results`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">
                      ผล & อันดับ
                    </Button>
                  </Link>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-xs text-faint">
                    สร้างโดย {s.createdBy}
                  </span>
                  {s.createdById === user.id && (
                    <div className="flex shrink-0 items-center gap-1">
                      <SessionStatusToggle sessionId={s.id} status={s.status} />
                      <DeleteSessionButton sessionId={s.id} title={s.title} />
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
