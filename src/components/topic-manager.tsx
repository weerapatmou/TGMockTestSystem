"use client";

import { useMemo, useState, useTransition } from "react";
import { createTopic, deleteTopic, updateTopic } from "@/actions/topics";
import { CATEGORIES, CATEGORY_LABEL, type Category } from "@/lib/topics";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Card, CardBody, FieldError, Label } from "@/components/ui/primitives";

type Topic = { id: string; name: string; category: Category };

export function TopicManager({ topics }: { topics: Topic[] }) {
  const [pending, start] = useTransition();
  const [actionError, setActionError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const [addName, setAddName] = useState("");
  const [addCategory, setAddCategory] = useState<Category>(CATEGORIES[0]);

  const topicsByCat = useMemo(() => {
    const map = new Map<Category, Topic[]>();
    for (const c of CATEGORIES) map.set(c, []);
    for (const t of topics) map.get(t.category)?.push(t);
    return map;
  }, [topics]);

  function startEdit(topic: Topic) {
    setEditingId(topic.id);
    setEditName(topic.name);
    setActionError(null);
  }

  function handleSaveEdit(topic: Topic) {
    setActionError(null);
    start(async () => {
      const res = await updateTopic({ id: topic.id, name: editName, category: topic.category });
      if (res.ok) {
        setEditingId(null);
      } else {
        setActionError(res.message);
      }
    });
  }

  function handleDelete(topic: Topic) {
    if (!window.confirm(`ลบหัวข้อ "${topic.name}"?`)) return;
    setActionError(null);
    start(async () => {
      const res = await deleteTopic(topic.id);
      if (!res.ok) setActionError(res.message);
    });
  }

  function handleAdd() {
    if (!addName.trim()) return;
    setActionError(null);
    start(async () => {
      const res = await createTopic({ name: addName, category: addCategory });
      if (res.ok) {
        setAddName("");
      } else {
        setActionError(res.message);
      }
    });
  }

  return (
    <div className="space-y-4">
      {actionError && <FieldError>{actionError}</FieldError>}

      {CATEGORIES.map((cat) => {
        const catTopics = topicsByCat.get(cat) ?? [];
        return (
          <Card key={cat}>
            <CardBody className="space-y-2">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
                {CATEGORY_LABEL[cat]}
                <span className="ml-2 font-normal text-faint">({catTopics.length})</span>
              </h2>

              {catTopics.length === 0 && (
                <p className="text-sm text-faint">ยังไม่มีหัวข้อในหมวดนี้</p>
              )}

              <ul className="divide-y divide-border">
                {catTopics.map((topic) => (
                  <li key={topic.id} className="flex items-center gap-2 py-2">
                    {editingId === topic.id ? (
                      <>
                        <Input
                          className="flex-1 h-8 text-sm"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSaveEdit(topic);
                            if (e.key === "Escape") setEditingId(null);
                          }}
                          autoFocus
                        />
                        <Button
                          size="sm"
                          onClick={() => handleSaveEdit(topic)}
                          disabled={pending || !editName.trim()}
                        >
                          บันทึก
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingId(null)}
                          disabled={pending}
                        >
                          ยกเลิก
                        </Button>
                      </>
                    ) : (
                      <>
                        <span className="flex-1 text-sm">{topic.name}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => startEdit(topic)}
                          disabled={pending}
                          aria-label="แก้ไข"
                        >
                          ✎
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleDelete(topic)}
                          disabled={pending}
                          aria-label="ลบ"
                        >
                          ✕
                        </Button>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>
        );
      })}

      <Card>
        <CardBody className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
            เพิ่มหัวข้อใหม่
          </h2>
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-40">
              <Label htmlFor="add-topic-name">ชื่อหัวข้อ</Label>
              <Input
                id="add-topic-name"
                value={addName}
                onChange={(e) => setAddName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }}
                placeholder="เช่น Pattern recognition"
              />
            </div>
            <div>
              <Label htmlFor="add-topic-cat">หมวดหมู่</Label>
              <Select
                id="add-topic-cat"
                value={addCategory}
                onChange={(e) => setAddCategory(e.target.value as Category)}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {CATEGORY_LABEL[c]}
                  </option>
                ))}
              </Select>
            </div>
            <Button
              onClick={handleAdd}
              disabled={pending || !addName.trim()}
            >
              + เพิ่มหัวข้อ
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
