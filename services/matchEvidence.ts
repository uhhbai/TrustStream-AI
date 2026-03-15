import { ClaimMatch, EvidenceMatchResult, Product } from "@/types";
import { mapClaimToEvidenceType } from "@/services/patterns";

export function matchEvidence(claims: ClaimMatch[], product: Product): EvidenceMatchResult[] {
  return claims.map((claim) => {
    const evidenceType = mapClaimToEvidenceType(claim.claimType);
    const item = product.evidence.find((ev) => ev.type === evidenceType);

    if (!item) {
      return {
        claimId: claim.id,
        evidenceStatus: "cannot_verify",
        note: "No matching evidence type is configured for this claim."
      };
    }

    if (item.available) {
      return {
        claimId: claim.id,
        evidenceStatus: "shown",
        supportingEvidence: item,
        note: item.detail
      };
    }

    return {
      claimId: claim.id,
      evidenceStatus: "not_shown",
      supportingEvidence: item,
      note: item.detail
    };
  });
}

/**
 * AI integration note:
 * Swap this with document/video verification APIs (OCR, invoice parsing, cert validation)
 * while preserving the status enum for UI compatibility.
 */
