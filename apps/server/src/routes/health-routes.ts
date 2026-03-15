import { FastifyPluginAsync } from "fastify";

const healthRoutes: FastifyPluginAsync = async (app) => {
  app.get("/health", async () => ({
    ok: true,
    service: "truststream-server",
    time: new Date().toISOString()
  }));
};

export default healthRoutes;
