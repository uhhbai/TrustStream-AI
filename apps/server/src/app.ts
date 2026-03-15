import Fastify from "fastify";
import analyzeRoutes from "./routes/analyze-routes";
import healthRoutes from "./routes/health-routes";
import sessionRoutes from "./routes/session-routes";
import { getPrismaClient } from "./lib/prisma";
import { SessionStore } from "./store/session-store";
import { SseHub } from "./lib/sse-hub";

export function buildServer() {
  const app = Fastify({
    logger: true
  });

  app.addHook("onRequest", async (_request, reply) => {
    reply.header("Access-Control-Allow-Origin", "*");
    reply.header("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    reply.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  });

  app.options("/*", async (_request, reply) => {
    return reply.status(204).send();
  });

  app.decorate("sessionStore", new SessionStore(getPrismaClient()));
  app.decorate("sseHub", new SseHub());

  app.register(healthRoutes);
  app.register(sessionRoutes);
  app.register(analyzeRoutes);

  return app;
}
