import type { Category } from "@/lib/topics";

/// A flattened score record (one user's result on one part) used by all stats.
export type ScoreRow = {
  userId: string;
  callsign: string;
  partId: string;
  setId: string;
  category: Category;
  scoreGot: number;
  questionsAttempted: number;
  totalQuestions: number;
};

export const DEFAULT_BONUS_WEIGHT = 0.15;

export function scorePct(correct: number, total: number): number {
  return total > 0 ? (correct / total) * 100 : 0;
}

export function accuracyPct(correct: number, attempted: number): number {
  return attempted > 0 ? (correct / attempted) * 100 : 0;
}

/// Combined index = (1-w)*Score% + w*Accuracy% — the ranking metric.
export function combinedIndex(
  sPct: number,
  aPct: number,
  weight = DEFAULT_BONUS_WEIGHT,
): number {
  const w = Math.min(Math.max(weight, 0), 1);
  return (1 - w) * sPct + w * aPct;
}

export type UserAggregate = {
  userId: string;
  callsign: string;
  totalCorrect: number;
  totalAttempted: number;
  totalQuestions: number;
  scorePct: number;
  accuracyPct: number;
  combined: number;
  rank: number;
};

/// Aggregate all rows per user and rank them by the combined index.
export function buildLeaderboard(
  rows: ScoreRow[],
  weight = DEFAULT_BONUS_WEIGHT,
): UserAggregate[] {
  const byUser = new Map<string, UserAggregate>();

  for (const r of rows) {
    let u = byUser.get(r.userId);
    if (!u) {
      u = {
        userId: r.userId,
        callsign: r.callsign,
        totalCorrect: 0,
        totalAttempted: 0,
        totalQuestions: 0,
        scorePct: 0,
        accuracyPct: 0,
        combined: 0,
        rank: 0,
      };
      byUser.set(r.userId, u);
    }
    u.totalCorrect += r.scoreGot;
    u.totalAttempted += r.questionsAttempted;
    u.totalQuestions += r.totalQuestions;
  }

  const list = [...byUser.values()].map((u) => {
    const sPct = scorePct(u.totalCorrect, u.totalQuestions);
    const aPct = accuracyPct(u.totalCorrect, u.totalAttempted);
    return {
      ...u,
      scorePct: sPct,
      accuracyPct: aPct,
      combined: combinedIndex(sPct, aPct, weight),
    };
  });

  list.sort((a, b) => b.combined - a.combined || b.totalCorrect - a.totalCorrect);

  // Standard competition ranking (ties share a rank).
  let lastCombined: number | null = null;
  let lastRank = 0;
  list.forEach((u, i) => {
    if (lastCombined !== null && Math.abs(u.combined - lastCombined) < 1e-9) {
      u.rank = lastRank;
    } else {
      u.rank = i + 1;
      lastRank = u.rank;
      lastCombined = u.combined;
    }
  });

  return list;
}

export type GroupStat = {
  count: number;
  avg: number;
  min: number;
  max: number;
};

/// avg / min / max of a numeric list (empty → zeros).
export function summarize(values: number[]): GroupStat {
  if (values.length === 0) return { count: 0, avg: 0, min: 0, max: 0 };
  let sum = 0;
  let min = Infinity;
  let max = -Infinity;
  for (const v of values) {
    sum += v;
    if (v < min) min = v;
    if (v > max) max = v;
  }
  return { count: values.length, avg: sum / values.length, min, max };
}

export type PartStat = {
  partId: string;
  scoreGot: GroupStat;
  scorePctStat: GroupStat;
  totalQuestions: number;
};

/// Group stats per part (avg/min/max of raw score and score%).
export function statsByPart(rows: ScoreRow[]): Map<string, PartStat> {
  const grouped = new Map<string, ScoreRow[]>();
  for (const r of rows) {
    const arr = grouped.get(r.partId) ?? [];
    arr.push(r);
    grouped.set(r.partId, arr);
  }
  const out = new Map<string, PartStat>();
  for (const [partId, list] of grouped) {
    out.set(partId, {
      partId,
      scoreGot: summarize(list.map((r) => r.scoreGot)),
      scorePctStat: summarize(
        list.map((r) => scorePct(r.scoreGot, r.totalQuestions)),
      ),
      totalQuestions: list[0]?.totalQuestions ?? 0,
    });
  }
  return out;
}

export type CategoryBreakdown = {
  category: Category;
  correct: number;
  attempted: number;
  total: number;
  scorePct: number;
  accuracyPct: number;
};

/// Roll rows up by topic category (works for one user's rows or the whole group).
export function breakdownByCategory(rows: ScoreRow[]): CategoryBreakdown[] {
  const byCat = new Map<Category, CategoryBreakdown>();
  for (const r of rows) {
    let c = byCat.get(r.category);
    if (!c) {
      c = {
        category: r.category,
        correct: 0,
        attempted: 0,
        total: 0,
        scorePct: 0,
        accuracyPct: 0,
      };
      byCat.set(r.category, c);
    }
    c.correct += r.scoreGot;
    c.attempted += r.questionsAttempted;
    c.total += r.totalQuestions;
  }
  for (const c of byCat.values()) {
    c.scorePct = scorePct(c.correct, c.total);
    c.accuracyPct = accuracyPct(c.correct, c.attempted);
  }
  return [...byCat.values()];
}
