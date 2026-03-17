import { describe, expect, it } from "vitest";
import {
  calculateTrustScore,
  classifyRiskFlags,
  detectClaims,
  generateBuyerQuestions
} from "../src/engine";

describe("claim detection", () => {
  it("detects authenticity and discount claims", () => {
    const claims = detectClaims(
      "This is 100% original and 80% off today only.",
      {
        sessionId: "s1",
        chunkId: "c1",
        transcriptWindow: []
      }
    );

    expect(claims.some((c) => c.claimCategory === "authenticity")).toBe(true);
    expect(claims.some((c) => c.claimCategory === "price")).toBe(true);
  });
});

describe("trust scoring", () => {
  it("scores lower for high-risk unresolved claims", () => {
    const claims = detectClaims("Guaranteed results. 100% original. Buy now.", {
      sessionId: "s1",
      chunkId: "c1",
      transcriptWindow: []
    }).map((claim) => ({ ...claim, evidenceStatus: "not_verified" as const }));

    const risks = classifyRiskFlags("Guaranteed results, buy now before it's gone.", {
      sessionId: "s1",
      chunkId: "c1",
      transcriptWindow: []
    });

    const score = calculateTrustScore(claims, risks, { verified: false, historyRiskCount: 3 });
    expect(score.score).toBeLessThan(50);
  });
});

describe("question generation", () => {
  it("generates focused questions", () => {
    const claims = detectClaims("FDA approved and free returns no questions asked.", {
      sessionId: "s1",
      chunkId: "c1",
      transcriptWindow: []
    }).map((claim) => ({ ...claim, evidenceStatus: "evidence_unclear" as const }));

    const risks = classifyRiskFlags("Buy now now now, 90% off", {
      sessionId: "s1",
      chunkId: "c1",
      transcriptWindow: []
    });

    const questions = generateBuyerQuestions(claims, risks);
    expect(questions.length).toBeGreaterThan(0);
  });
});

describe("provisional scoring", () => {
  it("moves above 50 after several clean transcript chunks", () => {
    const score = calculateTrustScore([], [], undefined, 4);

    expect(score.score).toBeGreaterThan(50);
    expect(score.explanation.positiveSignals[0]).toContain("Captured 4 transcript chunk");
  });

  it("rewards transparent low-pressure seller language", () => {
    const safeTranscript = [
      "Please check the product details carefully.",
      "I can show the invoice and return policy live.",
      "Results may vary depending on use.",
      "Take your time before checkout."
    ].join(" ");

    const score = calculateTrustScore([], [], undefined, 4, safeTranscript);

    expect(score.score).toBeGreaterThan(75);
    expect(score.label).toBe("trusted");
    expect(score.explanation.positiveSignals.some((item) => item.includes("invoice"))).toBe(true);
  });
});
