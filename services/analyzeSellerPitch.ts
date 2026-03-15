import { classifyRiskFlags } from "@/services/classifyRiskFlags";
import { detectClaims } from "@/services/detectClaims";
import { rewriteSellerPitch } from "@/services/rewriteSellerPitch";
import { LivestreamSession } from "@/types";

function textToSession(input: string): LivestreamSession {
  const lines = input
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => ({
      id: `seller-line-${index + 1}`,
      timestamp: `00:${String(index * 5).padStart(2, "0")}`,
      text: line
    }));

  return {
    id: "seller-input-session",
    title: "Seller Draft",
    country: "ASEAN",
    scenario: "mixed",
    sellerId: "draft",
    productId: "draft",
    viewerCount: 0,
    transcript: lines
  };
}

export function analyzeSellerPitch(input: string) {
  const session = textToSession(input);
  const claims = detectClaims(session);
  const risks = classifyRiskFlags(session);
  const rewrite = rewriteSellerPitch(input);

  return {
    claims,
    risks,
    ...rewrite
  };
}
