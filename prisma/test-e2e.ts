import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { buildLeaderboard, type ScoreRow } from "../src/lib/stats";
import type { Category } from "../src/lib/topics";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const callsigns = ["Maverick", "Goose", "Iceman"];

  // Idempotent: clear prior demo data.
  await prisma.user.deleteMany({ where: { callsign: { in: callsigns } } });

  const pw = await bcrypt.hash("test123", 10);
  const users = await Promise.all(
    callsigns.map((c) =>
      prisma.user.create({
        data: { callsign: c, callsignNorm: c.toLowerCase(), passwordHash: pw },
      }),
    ),
  );

  const topics = await prisma.topic.findMany({ take: 3 });

  const session = await prisma.mockSession.create({
    data: {
      title: "E2E Demo Mock Test",
      eventDate: new Date(),
      bonusWeight: 0.15,
      createdById: users[0].id,
      sets: {
        create: [
          {
            name: "ชุดที่ 1",
            order: 0,
            parts: {
              create: topics.map((t, i) => ({
                topicId: t.id,
                totalQuestions: 20,
                order: i,
              })),
            },
          },
        ],
      },
    },
    include: { sets: { include: { parts: { include: { topic: true } } } } },
  });

  const parts = session.sets.flatMap((s) => s.parts);

  // Scores: Maverick strong, Goose medium (answered fewer), Iceman weak.
  const plan = [
    { u: 0, vals: [[18, 20], [16, 20], [19, 20]] }, // correct, attempted
    { u: 1, vals: [[12, 14], [10, 12], [11, 13]] },
    { u: 2, vals: [[8, 20], [9, 20], [7, 20]] },
  ];
  for (const p of plan) {
    for (let i = 0; i < parts.length; i++) {
      const [correct, attempted] = p.vals[i];
      await prisma.score.create({
        data: {
          partId: parts[i].id,
          userId: users[p.u].id,
          scoreGot: correct,
          questionsAttempted: attempted,
          totalQuestions: 20,
        },
      });
    }
  }

  // Re-fetch and flatten into ScoreRow[], then rank.
  const full = await prisma.mockSession.findUniqueOrThrow({
    where: { id: session.id },
    include: {
      sets: {
        include: {
          parts: {
            include: {
              topic: true,
              scores: { include: { user: true } },
            },
          },
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
  console.log("\nLeaderboard (ranked by Combined Index):");
  for (const u of lb) {
    console.log(
      `  #${u.rank} ${u.callsign.padEnd(10)} combined=${u.combined.toFixed(1)} ` +
        `score%=${u.scorePct.toFixed(1)} acc%=${u.accuracyPct.toFixed(1)} ` +
        `raw=${u.totalCorrect}/${u.totalQuestions}`,
    );
  }

  // Test upsert (re-submit) updates instead of duplicating.
  await prisma.score.upsert({
    where: { partId_userId: { partId: parts[0].id, userId: users[2].id } },
    create: {
      partId: parts[0].id,
      userId: users[2].id,
      scoreGot: 15,
      questionsAttempted: 20,
      totalQuestions: 20,
    },
    update: { scoreGot: 15, questionsAttempted: 20 },
  });
  const cnt = await prisma.score.count({
    where: { partId: parts[0].id, userId: users[2].id },
  });
  console.log(`\nUpsert check — rows for (part,user) after re-submit: ${cnt} (expect 1)`);

  console.log("\n✓ E2E data + stats flow OK. Demo session id:", session.id);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
