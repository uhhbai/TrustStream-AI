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
