import { ClaimMatch, EvidenceMatchResult, Product, RiskFlag, StreamSummary } from "@/types";
import { generateBuyerQuestions } from "@/services/generateBuyerQuestions";

function unique(values: string[]) {
  return Array.from(new Set(values));
}

function describeTrustPosture(riskFlags: RiskFlag[], unverifiedCount: number) {
  const highRiskCount = riskFlags.filter((risk) => risk.severity === "high").length;
  if (highRiskCount >= 2 || unverifiedCount >= 3) return "Proceed with high caution";
  if (highRiskCount === 1 || unverifiedCount >= 1) return "Proceed with caution";
  return "Generally low-risk stream";
}

function humanizeClaim(type: ClaimMatch["claimType"]) {
  return type.replace(/_/g, " ");
}

export function generateSummary(params: {
  product: Product;
  claims: ClaimMatch[];
  evidenceMatches: EvidenceMatchResult[];
  riskFlags: RiskFlag[];
}): StreamSummary {
  const { product, claims, evidenceMatches, riskFlags } = params;
  const claimsMade = unique(claims.map((claim) => humanizeClaim(claim.claimType)));
  const demonstrated = unique(
    evidenceMatches
      .filter((match) => match.evidenceStatus === "shown")
      .map((match) => match.supportingEvidence?.title)
      .filter((item): item is string => Boolean(item))
  );
  const unverified = unique(
    evidenceMatches
      .filter((match) => match.evidenceStatus !== "shown")
      .map((match) => match.supportingEvidence?.title ?? match.note)
  );
  const buyerQuestions = generateBuyerQuestions({
    claims,
    evidenceMatches,
    riskFlags
  });

  const trustPosture = describeTrustPosture(riskFlags, unverified.length);
  const riskHighlights = unique(riskFlags.map((risk) => risk.riskType.replace(/_/g, " ")));
  const riskText = riskHighlights.length > 0 ? riskHighlights.join(", ") : "none significant";
  const verifiedCount = evidenceMatches.filter((match) => match.evidenceStatus === "shown").length;

  return {
    product: product.name,
    claimsMade,
    demonstrated,
    unverified,
    buyerQuestions,
    shortSummary: `${product.name} stream status: ${trustPosture}. ${claims.length} claim(s) detected, ${verifiedCount} backed by visible proof, ${unverified.length} unresolved. Risk signals: ${riskText}.`
  };
}

/**
 * AI integration note:
 * Replace this with an LLM summarizer that can produce multilingual summaries and
 * audience-specific guidance while preserving StreamSummary output fields.
 */
