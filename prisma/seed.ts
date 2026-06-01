import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { TOPIC_CATALOG } from "../src/lib/topics";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  for (const topic of TOPIC_CATALOG) {
    await prisma.topic.upsert({
      where: { name_category: { name: topic.name, category: topic.category } },
      create: { name: topic.name, category: topic.category },
      update: {},
    });
  }
  const count = await prisma.topic.count();
  console.log(`Seeded topics. Total topics in DB: ${count}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
