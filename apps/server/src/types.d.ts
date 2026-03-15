import "fastify";
import { SseHub } from "./lib/sse-hub";
import { SessionStore } from "./store/session-store";

declare module "fastify" {
  interface FastifyInstance {
    sessionStore: SessionStore;
    sseHub: SseHub;
  }
}
