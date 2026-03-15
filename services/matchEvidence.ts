import { ClaimMatch, ClaimType, EvidenceMatchResult, Product, ProductEvidence } from "@/types";

const EVIDENCE_MAP: Record<ClaimType, Array<ProductEvidence["type"]>> = {
  authenticity: ["authenticity", "invoice"],
  certification: ["certification"],
  urgency: ["stock"],
  returns: ["returns"],
  results: ["demo", "certification"],
  stock: ["stock"],
  price: ["invoice"]
};

function pickEvidence(product: Product, claimType: ClaimType) {
  const acceptedTypes = EVIDENCE_MAP[claimType];
  return product.evidence.filter((item) => acceptedTypes.includes(item.type));
}

function resolveStatus(claim: ClaimMatch, evidence: ProductEvidence[]): EvidenceMatchResult {
  if (evidence.length === 0) {
    return {
      claimId: claim.id,
      evidenceStatus: "cannot_verify",
      note: `No configured evidence source for ${claim.claimType} claims.`,
      matchQuality: "weak"
    };
  }

  const availableEvidence = evidence.find((item) => item.available);
  if (!availableEvidence) {
    return {
      claimId: claim.id,
      evidenceStatus: "not_shown",
      supportingEvidence: evidence[0],
      note: "Potential proof exists in metadata, but it was not shown during the stream.",
      matchQuality: "weak"
    };
  }

  if (claim.claimType === "returns") {
    const asksFreeReturns = /\bfree returns?\b|full refund|money[- ]back/i.test(claim.claimText);
    const restrictivePolicy = /\b(exchange only|store credit|approved issues)\b/i.test(
      availableEvidence.detail
    );
    if (asksFreeReturns && restrictivePolicy) {
      return {
        claimId: claim.id,
        evidenceStatus: "cannot_verify",
        supportingEvidence: availableEvidence,
        note: "Return promise appears broader than the provided policy evidence.",
        matchQuality: "partial"
      };
    }
  }

  if (claim.claimType === "authenticity") {
    const weakProof = /\bafter checkout|not shown\b/i.test(availableEvidence.detail);
    if (weakProof) {
      return {
        claimId: claim.id,
        evidenceStatus: "not_shown",
        supportingEvidence: availableEvidence,
        note: "Authenticity proof is referenced but not visibly demonstrated on-stream.",
        matchQuality: "weak"
      };
    }
  }

  return {
    claimId: claim.id,
    evidenceStatus: "shown",
    supportingEvidence: availableEvidence,
    note: availableEvidence.detail,
    matchQuality: "strong"
  };
}

export function matchEvidence(claims: ClaimMatch[], product: Product): EvidenceMatchResult[] {
  return claims.map((claim) => resolveStatus(claim, pickEvidence(product, claim.claimType)));
}

/**
 * AI integration note:
 * This deterministic matcher can be replaced with retrieval + proof-validation pipelines
 * (OCR/document verification/video grounding), while preserving response fields.
 */
