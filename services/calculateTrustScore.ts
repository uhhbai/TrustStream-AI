import { EvidenceMatchResult, RiskFlag, Seller, TrustScoreBreakdown } from "@/types";

function clamp(min: number, max: number, value: number) {
  return Math.min(max, Math.max(min, value));
}

export function calculateTrustScore(params: {
  evidenceMatches: EvidenceMatchResult[];
  riskFlags: RiskFlag[];
  seller: Seller;
  transcriptProgressRatio?: number;
}): TrustScoreBreakdown {
  const { evidenceMatches, riskFlags, seller, transcriptProgressRatio = 1 } = params;
  const shownCount = evidenceMatches.filter((m) => m.evidenceStatus === "shown").length;
  const notShownCount = evidenceMatches.filter((m) => m.evidenceStatus === "not_shown").length;
  const total = evidenceMatches.length || 1;

  const claimVerifiability = clamp(0, 100, Math.round((shownCount / total) * 100 - notShownCount * 8));
  const transparency = clamp(
    0,
    100,
    Math.round(claimVerifiability * 0.7 + transcriptProgressRatio * 30)
  );

  const sellerCredibility = clamp(
    0,
    100,
    Math.round(seller.rating * 20 + (seller.verified ? 8 : -8) - seller.pastViolations * 6)
  );

  const riskPenalty = riskFlags.reduce((sum, flag) => {
    if (flag.severity === "high") return sum + 10;
    if (flag.severity === "medium") return sum + 6;
    return sum + 3;
  }, 0);

  const score = clamp(
    0,
    100,
    Math.round(claimVerifiability * 0.4 + transparency * 0.2 + sellerCredibility * 0.4 - riskPenalty)
  );

  return {
    score,
    transparency,
    claimVerifiability,
    sellerCredibility,
    riskPenalty
  };
}

/**
 * AI integration note:
 * This deterministic model can be replaced by a calibrated scoring model with
 * feature weights learned from platform trust outcomes.
 */
