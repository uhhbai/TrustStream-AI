import { PrismaClient } from "@prisma/client";
import { env } from "./env";

let prisma: PrismaClient | null = null;

export function getPrismaClient() {
  if (env.useInMemoryDb || !env.databaseUrl) return null;
  if (!prisma) {
    prisma = new PrismaClient();
  }
  return prisma;
}
