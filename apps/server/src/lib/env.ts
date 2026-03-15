import dotenv from "dotenv";

dotenv.config();

export const env = {
  port: Number(process.env.PORT ?? 8787),
  host: process.env.HOST ?? "0.0.0.0",
  databaseUrl: process.env.DATABASE_URL,
  useInMemoryDb: process.env.USE_IN_MEMORY_DB === "true",
  nodeEnv: process.env.NODE_ENV ?? "development"
};
