import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.session.create({
    data: {
      platform: "generic",
      pageUrl: "https://example.com/livestream",
      status: "stopped",
      title: "Seed Session",
      language: "en",
      sensitivity: "balanced",
      endedAt: new Date()
    }
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (err) => {
    // eslint-disable-next-line no-console
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
