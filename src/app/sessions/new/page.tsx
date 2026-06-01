import { requireUser } from "@/lib/dal";
import { prisma } from "@/lib/db";
import { getSessionTemplates } from "@/lib/queries";
import { SessionBuilder } from "@/components/session-builder";
import { PageHeader } from "@/components/ui/primitives";
import type { Category } from "@/lib/topics";

export default async function NewSessionPage() {
  await requireUser();

  const [topics, templates] = await Promise.all([
    prisma.topic.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, category: true },
    }),
    getSessionTemplates(),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <PageHeader
        title="สร้าง Mock Test"
        subtitle="กำหนดชุดและ part ตามที่หัวหน้ากลุ่มส่งมา แล้วให้ทุกคนมาลงคะแนน"
      />
      <SessionBuilder
        topics={topics.map((t) => ({ ...t, category: t.category as Category }))}
        templates={templates}
      />
    </div>
  );
}
