import { ClaimMatch, EvidenceMatchResult, Product, RiskFlag, StreamSummary } from "@/types";

const defaultQuestions = [
  "Can you show an official invoice or distributor letter on-screen?",
  "What return terms apply if the product is not as described?",
  "Can you demonstrate the product serial number or certification details live?"
];

export function generateSummary(params: {
  product: Product;
  claims: ClaimMatch[];
  evidenceMatches: EvidenceMatchResult[];
  riskFlags: RiskFlag[];
}): StreamSummary {
  const { product, claims, evidenceMatches, riskFlags } = params;

  const claimsMade = Array.from(new Set(claims.map((c) => c.claimType)));
  const demonstrated = evidenceMatches
    .filter((m) => m.evidenceStatus === "shown")
    .map((m) => m.supportingEvidence?.title)
    .filter((item): item is string => Boolean(item));
  const unverified = evidenceMatches
    .filter((m) => m.evidenceStatus !== "shown")
    .map((m) => m.supportingEvidence?.title ?? m.note);

  const riskTypes = Array.from(new Set(riskFlags.map((r) => r.riskType)));
  const buyerQuestions =
    unverified.length > 0
      ? unverified.slice(0, 3).map((u) => `Can you provide proof for: ${u}?`)
      : defaultQuestions.slice(0, 2);

  return {
    product: product.name,
    claimsMade: claimsMade.map((claim) => claim.replace("_", " ")),
    demonstrated,
    unverified,
    buyerQuestions,
    shortSummary: `${product.name} was promoted with ${claims.length} claims. ${demonstrated.length} claim(s) had visible evidence, while ${unverified.length} remain unverified. Risk signals detected: ${
      riskTypes.length > 0 ? riskTypes.join(", ").replace(/_/g, " ") : "none significant"
    }.`
  };
}

/**
 * AI integration note:
 * Replace with summarization LLM calls for multilingual, personalized buyer summaries.
 */
