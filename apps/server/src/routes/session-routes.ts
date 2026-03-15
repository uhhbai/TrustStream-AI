import { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { transcribeAudioChunk } from "@truststream/ai";

const startSchema = z.object({
  platform: z.enum(["tiktok", "instagram", "shopee", "generic"]),
  pageUrl: z.string().url(),
  tabId: z.number().optional(),
  title: z.string().optional(),
  language: z.string().optional(),
  sensitivity: z.enum(["conservative", "balanced", "strict"]).optional()
});

const chunkSchema = z.object({
  text: z.string().min(1),
  source: z.enum(["dom_caption", "dom_product", "manual", "audio_stt"]),
  timestamp: z.string().optional(),
  visiblePageData: z
    .object({
      productName: z.string().optional(),
      listedPrice: z.string().optional(),
      sellerLabel: z.string().optional(),
      extraText: z.array(z.string()).optional()
    })
    .optional()
});

const audioChunkSchema = z.object({
  audioBase64: z.string().min(12),
  mimeType: z.string().min(3),
  timestamp: z.string().optional()
});

const sessionRoutes: FastifyPluginAsync = async (app) => {
  app.post("/api/session/start", async (request, reply) => {
    const parsed = startSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten() });
    }

    const session = await app.sessionStore.startSession(parsed.data);
    const state = await app.sessionStore.getSessionState(session.sessionId);
    if (state) {
      app.sseHub.emit(session.sessionId, { event: "session_started", state });
    }

    return session;
  });

  app.post("/api/session/:id/transcript-chunk", async (request, reply) => {
    const params = z.object({ id: z.string() }).safeParse(request.params);
    if (!params.success) {
      return reply.status(400).send({ error: "Invalid session ID." });
    }
    const parsed = chunkSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten() });
    }

    try {
      const state = await app.sessionStore.ingestChunk(params.data.id, parsed.data);
      app.sseHub.emit(params.data.id, { event: "chunk_processed", state });
      return state;
    } catch (error) {
      return reply.status(404).send({
        error: error instanceof Error ? error.message : "Session ingest failed."
      });
    }
  });

  app.post("/api/session/:id/audio-chunk", async (request, reply) => {
    const params = z.object({ id: z.string() }).safeParse(request.params);
    if (!params.success) {
      return reply.status(400).send({ error: "Invalid session ID." });
    }
    const parsed = audioChunkSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten() });
    }

    try {
      const buffer = Buffer.from(parsed.data.audioBase64, "base64");
      const transcript = await transcribeAudioChunk({
        audioBuffer: buffer,
        mimeType: parsed.data.mimeType
      });

      if (!transcript) {
        const state = await app.sessionStore.getSessionState(params.data.id);
        return reply.status(200).send({
          transcript: null,
          message:
            "Audio chunk could not be transcribed. Ensure OPENAI_API_KEY is set and audio capture is available.",
          state
        });
      }

      const state = await app.sessionStore.ingestChunk(params.data.id, {
        text: transcript,
        source: "audio_stt",
        timestamp: parsed.data.timestamp
      });

      app.sseHub.emit(params.data.id, { event: "chunk_processed", state });
      return { transcript, state };
    } catch (error) {
      return reply.status(500).send({
        error: error instanceof Error ? error.message : "Audio transcription failed."
      });
    }
  });

  app.get("/api/session/:id/state", async (request, reply) => {
    const params = z.object({ id: z.string() }).safeParse(request.params);
    if (!params.success) {
      return reply.status(400).send({ error: "Invalid session ID." });
    }

    const state = await app.sessionStore.getSessionState(params.data.id);
    if (!state) return reply.status(404).send({ error: "Session not found." });
    return state;
  });

  app.get("/api/session/:id/events", async (request, reply) => {
    const params = z.object({ id: z.string() }).safeParse(request.params);
    if (!params.success) {
      return reply.status(400).send({ error: "Invalid session ID." });
    }

    reply.raw.setHeader("Content-Type", "text/event-stream");
    reply.raw.setHeader("Cache-Control", "no-cache");
    reply.raw.setHeader("Connection", "keep-alive");
    reply.raw.flushHeaders?.();

    app.sseHub.addClient(params.data.id, reply);
    reply.raw.write(`event: ping\ndata: ${JSON.stringify({ ok: true })}\n\n`);

    request.raw.on("close", () => {
      app.sseHub.removeClient(reply);
      reply.raw.end();
    });
  });

  app.post("/api/session/:id/stop", async (request, reply) => {
    const params = z.object({ id: z.string() }).safeParse(request.params);
    if (!params.success) return reply.status(400).send({ error: "Invalid session ID." });

    const state = await app.sessionStore.stopSession(params.data.id);
    if (!state) return reply.status(404).send({ error: "Session not found." });

    app.sseHub.emit(params.data.id, { event: "session_stopped", state });
    return state;
  });

  app.get("/api/session/history", async (request) => {
    const query = z
      .object({
        limit: z
          .string()
          .regex(/^\d+$/)
          .optional()
      })
      .safeParse(request.query);
    const limit = query.success && query.data.limit ? Number(query.data.limit) : 15;
    return app.sessionStore.listHistory(limit);
  });
};

export default sessionRoutes;
