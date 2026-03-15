import { buildServer } from "./app";
import { env } from "./lib/env";

const app = buildServer();

app
  .listen({
    port: env.port,
    host: env.host
  })
  .then(() => {
    app.log.info(`TrustStream server running at http://${env.host}:${env.port}`);
  })
  .catch((err) => {
    app.log.error(err);
    process.exit(1);
  });
