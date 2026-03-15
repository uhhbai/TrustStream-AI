import { ClaimMatch, EvidenceMatchResult, RiskFlag, Seller, TrustScoreBreakdown } from "@/types";

function clamp(min: number, max: number, value: number) {
  return Math.min(max, Math.max(min, value));
}

function confidenceWeight(confidence: ClaimMatch["confidence"]) {
  if (confidence === "High") return 1.2;
  if (confidence === "Medium") return 1;
  return 0.8;
}

function severityWeight(severity: RiskFlag["severity"]) {
  if (severity === "high") return 13;
  if (severity === "medium") return 8;
  return 4;
}

function labelFromScore(score: number): "High" | "Medium" | "Low" {
  if (score >= 75) return "High";
  if (score >= 45) return "Medium";
  return "Low";
}

export function calculateTrustScore(params: {
  claims: ClaimMatch[];
  evidenceMatches: EvidenceMatchResult[];
  riskFlags: RiskFlag[];
  seller: Seller;
  transcriptProgressRatio?: number;
}): TrustScoreBreakdown {
  const { claims, evidenceMatches, riskFlags, seller, transcriptProgressRatio = 1 } = params;

  const claimById = new Map(claims.map((claim) => [claim.id, claim]));

  let weightedShown = 0;
  let weightedUnresolved = 0;
  let totalWeight = 0;
  evidenceMatches.forEach((match) => {
    const claim = claimById.get(match.claimId);
    const weight = confidenceWeight(claim?.confidence ?? "Medium");
    totalWeight += weight;

    if (match.evidenceStatus === "shown") {
      weightedShown += weight;
    } else if (match.evidenceStatus === "not_shown") {
      weightedUnresolved += weight * 1.15;
    } else {
      weightedUnresolved += weight * 1.3;
    }
  });

  if (totalWeight === 0) totalWeight = 1;

  const rawVerifiability = (weightedShown / totalWeight) * 100 - weightedUnresolved * 8;
  const claimVerifiability = clamp(0, 100, Math.round(rawVerifiability));

  const proofMentions = evidenceMatches.filter((match) =>
    /(shown|demonstrated|invoice|report|policy)/i.test(match.note)
  ).length;
  const transparency = clamp(
    0,
    100,
    Math.round(
      claimVerifiability * 0.65 +
        Math.min(25, proofMentions * 4) +
        clamp(0, 10, transcriptProgressRatio * 10)
    )
  );

  const sellerCredibility = clamp(
    0,
    100,
    Math.round(
      seller.rating * 18 + (seller.verified ? 12 : -6) - seller.pastViolations * 7
    )
  );

  const repeatedRiskCounts = riskFlags.reduce<Record<string, number>>((acc, risk) => {
    acc[risk.riskType] = (acc[risk.riskType] ?? 0) + 1;
    return acc;
  }, {});

  let riskPenalty = riskFlags.reduce((sum, risk) => sum + severityWeight(risk.severity), 0);
  Object.values(repeatedRiskCounts).forEach((count) => {
    if (count > 1) riskPenalty += (count - 1) * 3;
  });

  const urgencyBurst = (repeatedRiskCounts.fake_urgency ?? 0) + (repeatedRiskCounts.pressure_tactic ?? 0);
  if (urgencyBurst >= 3) riskPenalty += 8;
  if ((repeatedRiskCounts.unverifiable_authenticity ?? 0) >= 2) riskPenalty += 6;

  const baseline = claimVerifiability * 0.42 + transparency * 0.2 + sellerCredibility * 0.38;
  const score = clamp(0, 100, Math.round(baseline - riskPenalty));

  return {
    score,
    transparency,
    claimVerifiability,
    sellerCredibility,
    riskPenalty,
    confidenceLabel: labelFromScore(score)
  };
}

/**
 * AI integration note:
 * This placeholder scoring engine can be replaced by a calibrated model using
 * outcome-labeled trust data while preserving this breakdown interface.
 */
