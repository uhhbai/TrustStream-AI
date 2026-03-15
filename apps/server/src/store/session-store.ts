import { PrismaClient } from "@prisma/client";
import {
  ChunkIngestRequest,
  PlatformName,
  SessionHistoryItem,
  SessionStartRequest,
  SessionStartResponse,
  SessionStateResponse,
  SessionStatus
} from "@truststream/shared";
import { analyzeTranscriptChunk } from "@truststream/ai";
import { randomUUID } from "node:crypto";

type SessionMemoryState = {
  sessionId: string;
  platform: PlatformName;
  pageUrl: string;
  status: SessionStatus;
  startedAt: string;
  updatedAt: string;
  chunks: Array<{
    id: string;
    text: string;
    source: "dom_caption" | "dom_product" | "manual" | "audio_stt";
    timestamp: string;
  }>;
  state: SessionStateResponse;
  title?: string;
  language?: string;
  sensitivity?: "conservative" | "balanced" | "strict";
  endedAt?: string;
};

export class SessionStore {
  private sessions = new Map<string, SessionMemoryState>();

  constructor(private prisma: PrismaClient | null) {}

  async startSession(input: SessionStartRequest): Promise<SessionStartResponse> {
    const sessionId = randomUUID();
    const now = new Date().toISOString();
    const status: SessionStatus = "listening";

    const initialState: SessionStateResponse = {
      sessionId,
      status,
      platform: input.platform,
      pageUrl: input.pageUrl,
      updatedAt: now,
      trustScore: {
        score: 50,
        label: "caution",
        confidence: "Low",
        explanation: {
          positiveSignals: [],
          negativeSignals: ["Waiting for transcript chunks. Score is provisional."],
          weightedFactors: { provisionalBaseline: 50 }
        }
      },
      claims: [],
      riskFlags: [],
      suggestedQuestions: [],
      summary: {
        rollingSummary: "Session started. Waiting for transcript signals.",
        buyerGuidance: [],
        keyChanges: []
      },
      chunkCount: 0,
      transcriptFeed: []
    };

    this.sessions.set(sessionId, {
      sessionId,
      platform: input.platform,
      pageUrl: input.pageUrl,
      status,
      startedAt: now,
      updatedAt: now,
      chunks: [],
      state: initialState,
      language: input.language,
      sensitivity: input.sensitivity,
      title: input.title
    });

    if (this.prisma) {
      await this.prisma.session.create({
        data: {
          id: sessionId,
          platform: input.platform,
          pageUrl: input.pageUrl,
          status,
          tabId: input.tabId,
          title: input.title,
          language: input.language,
          sensitivity: input.sensitivity
        }
      });
    }

    return {
      sessionId,
      status,
      platform: input.platform,
      startedAt: now
    };
  }

  async ingestChunk(sessionId: string, chunk: ChunkIngestRequest): Promise<SessionStateResponse> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    const chunkId = randomUUID();
    const timestamp = chunk.timestamp ?? new Date().toISOString();
    session.chunks.push({
      id: chunkId,
      text: chunk.text,
      source: chunk.source,
      timestamp
    });

    const transcriptWindow = session.chunks.slice(-20).map((item) => item.text);

    const analysis = await analyzeTranscriptChunk({
      transcriptChunk: chunk.text,
      context: {
        sessionId,
        chunkId,
        transcriptWindow,
        visiblePageData: chunk.visiblePageData,
        sensitivity: session.sensitivity
      },
      existingSummary: session.state.summary
    });

    const mergedClaims = [...analysis.claims, ...session.state.claims].slice(0, 40);
    const mergedRisks = [...analysis.riskFlags, ...session.state.riskFlags].slice(0, 40);
    const suggestedQuestions = Array.from(
      new Set([...analysis.suggestedQuestions, ...session.state.suggestedQuestions])
    ).slice(0, 6);

    session.state = {
      ...session.state,
      status: "analyzing",
      updatedAt: new Date().toISOString(),
      claims: mergedClaims,
      riskFlags: mergedRisks,
      trustScore: analysis.trustScore,
      suggestedQuestions,
      summary: analysis.summary,
      chunkCount: session.chunks.length,
      transcriptFeed: session.chunks.slice(-25).map((item) => ({
        chunkId: item.id,
        text: item.text,
        source: item.source,
        timestamp: item.timestamp
      }))
    };

    session.updatedAt = session.state.updatedAt;

    if (this.prisma) {
      await this.prisma.transcriptChunk.create({
        data: {
          id: chunkId,
          sessionId,
          text: chunk.text,
          source: chunk.source,
          rawPayload: chunk.visiblePageData ?? {}
        }
      });

      if (analysis.claims.length > 0) {
        await this.prisma.claim.createMany({
          data: analysis.claims.map((claim) => ({
            id: claim.id,
            sessionId,
            chunkId,
            claimText: claim.claimText,
            claimCategory: claim.claimCategory,
            confidence: claim.confidence,
            evidenceStatus: claim.evidenceStatus,
            reasoning: claim.reasoning,
            recommendedQuestion: claim.recommendedQuestion
          })),
          skipDuplicates: true
        });
      }

      if (analysis.riskFlags.length > 0) {
        await this.prisma.riskFlag.createMany({
          data: analysis.riskFlags.map((risk) => ({
            id: risk.id,
            sessionId,
            chunkId,
            riskType: risk.riskType,
            severity: risk.severity,
            confidence: risk.confidence,
            triggerText: risk.triggerText,
            reasoning: risk.reasoning
          })),
          skipDuplicates: true
        });
      }

      await this.prisma.trustScoreHistory.create({
        data: {
          sessionId,
          score: analysis.trustScore.score,
          label: analysis.trustScore.label,
          confidence: analysis.trustScore.confidence,
          explanation: analysis.trustScore.explanation
        }
      });

      await this.prisma.summarySnapshot.create({
        data: {
          sessionId,
          rollingSummary: analysis.summary.rollingSummary,
          buyerGuidance: analysis.summary.buyerGuidance,
          keyChanges: analysis.summary.keyChanges
        }
      });

      await this.prisma.session.update({
        where: { id: sessionId },
        data: {
          status: session.state.status
        }
      });
    }

    return session.state;
  }

  async getSessionState(sessionId: string): Promise<SessionStateResponse | null> {
    return this.sessions.get(sessionId)?.state ?? null;
  }

  async stopSession(sessionId: string): Promise<SessionStateResponse | null> {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    session.status = "stopped";
    session.endedAt = new Date().toISOString();
    session.state = {
      ...session.state,
      status: "stopped",
      updatedAt: session.endedAt
    };

    if (this.prisma) {
      await this.prisma.session.update({
        where: { id: sessionId },
        data: {
          status: "stopped",
          endedAt: new Date()
        }
      });
    }

    return session.state;
  }

  async listHistory(limit = 15): Promise<SessionHistoryItem[]> {
    const memoryHistory = Array.from(this.sessions.values())
      .sort((a, b) => (a.startedAt > b.startedAt ? -1 : 1))
      .slice(0, limit)
      .map((session) => ({
        sessionId: session.sessionId,
        platform: session.platform,
        pageUrl: session.pageUrl,
        startedAt: session.startedAt,
        endedAt: session.endedAt,
        latestScore: session.state.trustScore.score,
        latestLabel: session.state.trustScore.label
      }));

    return memoryHistory;
  }
}
