import { livestreamSessions, products, sellers } from "@/data/mockData";
import { SessionAnalysis } from "@/types";
import { calculateTrustScore } from "@/services/calculateTrustScore";
import { classifyRiskFlags } from "@/services/classifyRiskFlags";
import { detectClaims } from "@/services/detectClaims";
import { generateSummary } from "@/services/generateSummary";
import { matchEvidence } from "@/services/matchEvidence";

export function analyzeSession(sessionId: string, lineLimit?: number): SessionAnalysis {
  const session = livestreamSessions.find((item) => item.id === sessionId);
  if (!session) {
    throw new Error(`Unknown session ID: ${sessionId}`);
  }

  const product = products.find((item) => item.id === session.productId);
  const seller = sellers.find((item) => item.id === session.sellerId);

  if (!product || !seller) {
    throw new Error("Session data is incomplete. Missing seller or product.");
  }

  const claims = detectClaims(session, lineLimit);
  const riskFlags = classifyRiskFlags(session, lineLimit);
  const evidenceMatches = matchEvidence(claims, product);
  const progressRatio = lineLimit ? lineLimit / session.transcript.length : 1;

  const trustScore = calculateTrustScore({
    evidenceMatches,
    riskFlags,
    seller,
    transcriptProgressRatio: progressRatio
  });

  const summary = generateSummary({
    product,
    claims,
    evidenceMatches,
    riskFlags
  });

  return { claims, evidenceMatches, riskFlags, trustScore, summary };
}
