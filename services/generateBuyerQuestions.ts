import { ClaimMatch, EvidenceMatchResult, RiskFlag } from "@/types";

const QUESTION_BY_CLAIM: Record<string, string> = {
  authenticity: "Can you show an official invoice or authorization letter on-screen right now?",
  certification: "Can you show the certification body, date, and certificate number clearly?",
  returns: "Can you confirm the exact return/refund terms shown in checkout policy?",
  results: "What proof do you have beyond testimonials for this promised result?",
  stock: "Can you show live stock count from your seller dashboard?",
  urgency: "Is the countdown platform-driven or manually stated by the seller?",
  price: "Can you show the prior selling price history for this discount claim?"
};

const QUESTION_BY_RISK: Record<string, string> = {
  fake_urgency: "Can you keep this offer open for 10 minutes so buyers can verify details?",
  exaggerated_guarantee: "Can you restate expected outcomes without absolute guarantees?",
  deep_discount_pressure: "Can you show why the discount is unusually deep today?",
  unverifiable_authenticity: "Can you provide proof of authenticity before buyers check out?",
  refund_policy_conflict: "Which refund policy is final: full refund or no refund?",
  pressure_tactic: "Can you explain product details without urgency prompts?",
  emotional_manipulation: "Can we focus on product evidence rather than social pressure?"
};

export function generateBuyerQuestions(params: {
  claims: ClaimMatch[];
  evidenceMatches: EvidenceMatchResult[];
  riskFlags: RiskFlag[];
  maxQuestions?: number;
}): string[] {
  const { claims, evidenceMatches, riskFlags, maxQuestions = 5 } = params;
  const questions: string[] = [];
  const claimById = new Map(claims.map((claim) => [claim.id, claim]));

  evidenceMatches.forEach((match) => {
    if (match.evidenceStatus === "shown") return;
    const claim = claimById.get(match.claimId);
    if (!claim) return;
    questions.push(
      QUESTION_BY_CLAIM[claim.claimType] ??
        `Can you provide stronger proof for this ${claim.claimType} claim?`
    );
  });

  riskFlags
    .sort((a, b) => (a.severity === b.severity ? 0 : a.severity === "high" ? -1 : 1))
    .forEach((risk) => {
      const template = QUESTION_BY_RISK[risk.riskType];
      if (template) questions.push(template);
    });

  if (questions.length === 0) {
    questions.push("Can you summarize the product proof and return policy before checkout?");
  }

  return Array.from(new Set(questions)).slice(0, maxQuestions);
}

/**
 * AI integration note:
 * This rule-based question generator can be replaced with an LLM that personalizes
 * questions by user profile, language, and risk tolerance.
 */
