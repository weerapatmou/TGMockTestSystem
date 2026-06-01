import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { buildLeaderboard, type ScoreRow } from "../src/lib/stats";
import type { Category } from "../src/lib/topics";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// 10 anonymized placeholder accounts, in the PDF's row order. The real call signs
// (Go_daniel, kibo, SV, SPTG ปีนี้ว้อย, Gg, อัศวินรัตติกาล, Jigglypuff, j, K, TG) are
// dropped — those people re-register their own accounts later.
const CALLSIGNS = Array.from({ length: 10 }, (_, i) => `user${i + 1}`);
const PASSWORD = "mock2026";
const EVENT_DATE = new Date("2026-05-31");

// A single cell: [scoreGot (C), questionsAttempted (D)], or null when the user did not
// take that part ("–" in the PDF). An optional 3rd element overrides the per-Score
// totalQuestions snapshot (used once: user6 Mock I 3D box, where the PDF's column T=15
// is wrong and the real total was 20).
type Cell = [number, number] | [number, number, number] | null;

// A scored part: maps a PDF column to a catalog topic, with the column total and one
// cell per user (user1…user10 order).
type PartSpec = {
  topic: string; // must match a name in TOPIC_CATALOG / the Topic table
  totalQuestions: number; // column T
  cells: Cell[]; // length 10
};

type SessionSpec = {
  title: string;
  setName: string;
  parts: PartSpec[];
};

const SESSIONS: SessionSpec[] = [
  {
    title: "310526 Mock I",
    setName: "Mock I",
    parts: [
      {
        topic: "Series Number",
        totalQuestions: 20,
        cells: [[16, 17], [12, 13], [13, 15], [12, 12], [8, 9], [9, 12], [11, 13], [15, 20], [12, 17], [14, 17]],
      },
      {
        topic: "Series Picture",
        totalQuestions: 20,
        cells: [[16, 19], [14, 15], [4, 8], [11, 11], [10, 10], [10, 10], [14, 16], [13, 19], [8, 9], [10, 18]],
      },
      {
        topic: "STM (passage)",
        totalQuestions: 20,
        cells: [[14, 16], [17, 19], [16, 16], [11, 14], [9, 9], [17, 19], [16, 20], [14, 18], [10, 15], [13, 16]],
      },
      {
        topic: "Deviation check",
        totalQuestions: 45,
        cells: [[33, 36], [26, 32], [20, 28], [28, 37], [27, 28], [23, 29], [24, 27], [27, 32], [27, 40], [26, 32]],
      },
      {
        topic: "Scanning Shape",
        totalQuestions: 40,
        cells: [[18, 20], [24, 24], [15, 15], [18, 18], [15, 15], [16, 16], [23, 23], [20, 25], [14, 17], [15, 15]],
      },
      {
        // PDF column "3D missing". user6 reads C=19/D=20 against column T=15 (impossible);
        // confirmed the real total was 20, stored as a per-Score snapshot override.
        topic: "3D box",
        totalQuestions: 15,
        cells: [[13, 15], [14, 15], [14, 15], [12, 15], [15, 15], [19, 20, 20], [12, 15], [13, 15], [14, 15], [14, 15]],
      },
      {
        topic: "Spatial folding",
        totalQuestions: 35,
        cells: [[15, 21], [15, 17], [12, 15], [9, 13], [14, 17], null, [13, 15], [12, 20], [9, 14], [13, 15]],
      },
      {
        topic: "Approximation",
        totalQuestions: 35,
        cells: [[23, 30], [20, 27], [23, 27], [19, 25], [17, 24], null, [21, 26], [25, 35], [26, 35], [27, 30]],
      },
      {
        topic: "Block counting",
        totalQuestions: 20,
        cells: [[12, 15], [17, 20], [18, 20], [14, 19], [19, 20], [14, 19], [17, 20], [14, 20], [15, 20], [15, 20]],
      },
    ],
  },
  {
    title: "310526 Mock II",
    setName: "Mock II",
    parts: [
      {
        topic: "Series Picture",
        totalQuestions: 20,
        cells: [[9, 12], [10, 14], [8, 10], [10, 12], [12, 15], [6, 15], [8, 11], [12, 20], [12, 14], [12, 15]],
      },
      {
        topic: "Jigsaw 2D",
        totalQuestions: 20,
        cells: [[18, 20], [17, 20], [16, 20], [15, 19], [17, 20], [14, 20], [17, 20], [15, 20], [14, 20], [13, 18]],
      },
      {
        topic: "Hidden img",
        totalQuestions: 20,
        cells: [[20, 20], [20, 20], [18, 20], [20, 20], [15, 15], [19, 20], [19, 20], [20, 20], [20, 20], [19, 20]],
      },
      {
        topic: "Deviation check",
        totalQuestions: 45,
        cells: [[19, 22], [19, 22], [17, 20], [18, 22], [19, 22], [14, 16], [18, 20], [21, 24], [18, 31], [18, 20]],
      },
      {
        topic: "Box folding",
        totalQuestions: 25,
        cells: [[4, 9], [7, 9], [5, 7], [3, 5], [5, 8], [5, 10], [3, 6], [5, 9], [3, 4], [10, 13]],
      },
      {
        topic: "Comparison",
        totalQuestions: 40,
        cells: [[40, 40], [40, 40], [40, 40], [32, 32], [40, 40], [40, 40], [40, 40], [40, 40], [40, 40], [40, 40]],
      },
      {
        topic: "STM (letter) grid",
        totalQuestions: 20,
        cells: [[20, 20], [18, 18], [10, 12], [13, 18], [16, 18], [19, 19], [20, 20], [15, 20], [16, 20], [12, 14]],
      },
      {
        topic: "Logic gate",
        totalQuestions: 20,
        cells: [[20, 20], [20, 20], [20, 20], [15, 20], [20, 20], [20, 20], [18, 20], [18, 20], [20, 20], [20, 20]],
      },
      {
        topic: "Key fitting",
        totalQuestions: 10,
        cells: [[9, 10], [10, 10], [10, 10], [10, 10], [9, 9], [10, 10], [10, 10], [10, 10], [10, 10], [10, 10]],
      },
      {
        topic: "Aircraft rotation",
        totalQuestions: 30,
        cells: [[28, 29], [12, 14], [11, 16], [16, 18], [6, 7], [5, 16], [5, 11], [8, 12], [8, 8], [14, 14]],
      },
    ],
  },
];

async function main() {
  // 1. Idempotent cleanup — delete sessions first (cascades sets/parts/scores), then the
  //    placeholder users (User→Score / User→createdSessions have no cascade).
  await prisma.mockSession.deleteMany({
    where: { title: { in: SESSIONS.map((s) => s.title) } },
  });
  await prisma.user.deleteMany({ where: { callsign: { in: CALLSIGNS } } });

  // 2. Create the 10 placeholder users (sequentially — the local prisma dev server
  //    closes the connection under many concurrent writes).
  const passwordHash = await bcrypt.hash(PASSWORD, 10);
  const users = [];
  for (const c of CALLSIGNS) {
    users.push(
      await prisma.user.create({
        data: { callsign: c, callsignNorm: c.toLowerCase(), passwordHash },
      }),
    );
  }

  // 3. Load topics and assert every mapped name exists (seed must have run).
  const topics = await prisma.topic.findMany();
  const topicByName = new Map(topics.map((t) => [t.name, t]));
  const needed = new Set(SESSIONS.flatMap((s) => s.parts.map((p) => p.topic)));
  const missing = [...needed].filter((n) => !topicByName.has(n));
  if (missing.length) {
    throw new Error(
      `Missing topics in DB: ${missing.join(", ")}. Run "npm run db:seed" first.`,
    );
  }

  for (const spec of SESSIONS) {
    // 4. Build the session with its single set and parts (in column order).
    const session = await prisma.mockSession.create({
      data: {
        title: spec.title,
        eventDate: EVENT_DATE,
        bonusWeight: 0.15,
        createdById: users[0].id,
        sets: {
          create: [
            {
              name: spec.setName,
              order: 0,
              parts: {
                create: spec.parts.map((p, i) => ({
                  topicId: topicByName.get(p.topic)!.id,
                  totalQuestions: p.totalQuestions,
                  order: i,
                })),
              },
            },
          ],
        },
      },
      include: { sets: { include: { parts: { include: { topic: true } } } } },
    });

    // 5. Insert scores. Parts come back in creation order, matching spec.parts.
    const parts = session.sets[0].parts;
    for (let pi = 0; pi < spec.parts.length; pi++) {
      const partSpec = spec.parts[pi];
      const part = parts[pi];
      for (let ui = 0; ui < users.length; ui++) {
        const cell = partSpec.cells[ui];
        if (!cell) continue; // "–": user did not take this part
        const [scoreGot, questionsAttempted, totalOverride] = cell;
        await prisma.score.create({
          data: {
            partId: part.id,
            userId: users[ui].id,
            scoreGot,
            questionsAttempted,
            totalQuestions: totalOverride ?? partSpec.totalQuestions,
          },
        });
      }
    }

    // 6. Print a leaderboard for a quick eyeball check.
    const full = await prisma.mockSession.findUniqueOrThrow({
      where: { id: session.id },
      include: {
        sets: {
          include: {
            parts: { include: { topic: true, scores: { include: { user: true } } } },
          },
        },
      },
    });
    const rows: ScoreRow[] = [];
    for (const set of full.sets)
      for (const part of set.parts)
        for (const sc of part.scores)
          rows.push({
            userId: sc.user.id,
            callsign: sc.user.callsign,
            partId: part.id,
            setId: set.id,
            category: part.topic.category as Category,
            scoreGot: sc.scoreGot,
            questionsAttempted: sc.questionsAttempted,
            totalQuestions: sc.totalQuestions,
          });

    const lb = buildLeaderboard(rows, full.bonusWeight);
    console.log(`\n${spec.title} — leaderboard (by Combined Index):`);
    for (const u of lb) {
      console.log(
        `  #${u.rank} ${u.callsign.padEnd(7)} combined=${u.combined.toFixed(1)} ` +
          `score%=${u.scorePct.toFixed(1)} acc%=${u.accuracyPct.toFixed(1)} ` +
          `raw=${u.totalCorrect}/${u.totalQuestions}`,
      );
    }
    console.log(`  (session id: ${session.id}, ${rows.length} scores)`);
  }

  console.log("\n✓ Imported 310526 Mock I & II for user1…user10.");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
