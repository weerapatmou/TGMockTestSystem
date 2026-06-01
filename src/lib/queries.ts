import "server-only";
import { prisma } from "@/lib/db";
import type { Category } from "@/lib/topics";
import type { ScoreRow } from "@/lib/stats";

/// Full session tree (sets → parts → topic) plus every score with the scorer's callsign.
export async function getSessionWithScores(sessionId: string) {
  const session = await prisma.mockSession.findUnique({
    where: { id: sessionId },
    include: {
      createdBy: { select: { id: true, callsign: true } },
      sets: {
        orderBy: { order: "asc" },
        include: {
          parts: {
            orderBy: { order: "asc" },
            include: {
              topic: { select: { name: true, category: true } },
              scores: {
                include: { user: { select: { id: true, callsign: true } } },
              },
            },
          },
        },
      },
    },
  });
  if (!session) return null;

  const rows: ScoreRow[] = [];
  for (const set of session.sets) {
    for (const part of set.parts) {
      for (const score of part.scores) {
        rows.push({
          userId: score.user.id,
          callsign: score.user.callsign,
          partId: part.id,
          setId: set.id,
          category: part.topic.category as Category,
          scoreGot: score.scoreGot,
          questionsAttempted: score.questionsAttempted,
          totalQuestions: score.totalQuestions,
        });
      }
    }
  }

  return { session, rows };
}

/// Sessions list for the dashboard, with light aggregate counts.
export async function getSessionsForDashboard() {
  const sessions = await prisma.mockSession.findMany({
    orderBy: [{ eventDate: "desc" }, { createdAt: "desc" }],
    include: {
      createdBy: { select: { callsign: true } },
      sets: {
        select: {
          parts: {
            select: {
              totalQuestions: true,
              _count: { select: { scores: true } },
            },
          },
        },
      },
    },
  });

  return sessions.map((s) => {
    const parts = s.sets.flatMap((set) => set.parts);
    const totalQuestions = parts.reduce((acc, p) => acc + p.totalQuestions, 0);
    // Distinct participants is approximated by max scores on any part (cheap + good enough here).
    const maxScoresOnAPart = parts.reduce(
      (m, p) => Math.max(m, p._count.scores),
      0,
    );
    return {
      id: s.id,
      title: s.title,
      eventDate: s.eventDate,
      status: s.status,
      note: s.note,
      createdById: s.createdById,
      createdBy: s.createdBy.callsign,
      setCount: s.sets.length,
      partCount: parts.length,
      totalQuestions,
      participants: maxScoresOnAPart,
    };
  });
}

/// Lightweight session structures used to clone a previous week's layout.
export async function getSessionTemplates() {
  const sessions = await prisma.mockSession.findMany({
    orderBy: [{ eventDate: "desc" }, { createdAt: "desc" }],
    take: 20,
    select: {
      id: true,
      title: true,
      bonusWeight: true,
      sets: {
        orderBy: { order: "asc" },
        select: {
          name: true,
          parts: {
            orderBy: { order: "asc" },
            select: { topicId: true, label: true, totalQuestions: true },
          },
        },
      },
    },
  });
  return sessions;
}

/// All score rows for one user across all sessions (for the personal /me page).
export async function getUserScoreHistory(userId: string) {
  const scores = await prisma.score.findMany({
    where: { userId },
    include: {
      user: { select: { id: true, callsign: true } },
      part: {
        include: {
          topic: { select: { name: true, category: true } },
          set: {
            include: {
              session: {
                select: { id: true, title: true, eventDate: true, bonusWeight: true },
              },
            },
          },
        },
      },
    },
  });

  return scores.map((s) => ({
    sessionId: s.part.set.session.id,
    sessionTitle: s.part.set.session.title,
    eventDate: s.part.set.session.eventDate,
    bonusWeight: s.part.set.session.bonusWeight,
    topicName: s.part.label || s.part.topic.name,
    row: {
      userId: s.user.id,
      callsign: s.user.callsign,
      partId: s.partId,
      setId: s.part.setId,
      category: s.part.topic.category as Category,
      scoreGot: s.scoreGot,
      questionsAttempted: s.questionsAttempted,
      totalQuestions: s.totalQuestions,
    } satisfies ScoreRow,
  }));
}
