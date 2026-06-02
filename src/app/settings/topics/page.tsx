import { requireUser } from "@/lib/dal";
import { prisma } from "@/lib/db";
import { PageHeader } from "@/components/ui/primitives";
import { TopicManager } from "@/components/topic-manager";
import type { Category } from "@/lib/topics";

export const metadata = { title: "จัดการหัวข้อ" };

export default async function TopicsSettingsPage() {
  await requireUser();

  const topics = await prisma.topic.findMany({
    orderBy: [{ category: "asc" }, { name: "asc" }],
    select: { id: true, name: true, category: true },
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <PageHeader
        title="จัดการหัวข้อ"
        subtitle="เพิ่ม ลบ หรือแก้ไขชื่อหัวข้อที่ใช้ใน Mock Test"
      />
      <TopicManager
        topics={topics.map((t) => ({ ...t, category: t.category as Category }))}
      />
    </div>
  );
}
