import { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { analyzeTranscriptChunk, rewriteSellerPitchEnhanced } from "@truststream/ai";

const analyzeSchema = z.object({
  text: z.string().min(1),
  context: z
    .object({
      language: z.string().optional(),
      sensitivity: z.enum(["conservative", "balanced", "strict"]).optional()
    })
    .optional()
});

const rewriteSchema = z.object({
  text: z.string().min(1)
});

const analyzeRoutes: FastifyPluginAsync = async (app) => {
  app.post("/api/analyze/text", async (request, reply) => {
    const parsed = analyzeSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten() });
    }

    const analysis = await analyzeTranscriptChunk({
      transcriptChunk: parsed.data.text,
      context: {
        sessionId: "ad-hoc",
        chunkId: "ad-hoc-chunk",
        transcriptWindow: [parsed.data.text],
        sensitivity: parsed.data.context?.sensitivity
      }
    });

    return analysis;
  });

  app.post("/api/rewrite/seller-pitch", async (request, reply) => {
    const parsed = rewriteSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: parsed.error.flatten() });
    }

    return rewriteSellerPitchEnhanced(parsed.data.text);
  });
};

export default analyzeRoutes;
