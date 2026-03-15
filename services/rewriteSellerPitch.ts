interface RewriteResult {
  riskyPhrases: string[];
  rewrittenPitch: string;
  trustImprovementScore: number;
  recommendations: string[];
}

const rewriteRules: { regex: RegExp; replacement: string; recommendation: string }[] = [
  {
    regex: /\b100%\s*original\b/gi,
    replacement: "sourced from our listed supplier, with proof available on request",
    recommendation: "Replace absolute authenticity claims with verifiable sourcing statements."
  },
  {
    regex: /\bguaranteed results?\b/gi,
    replacement: "results vary by user, based on regular use and product fit",
    recommendation: "Avoid guaranteed outcomes. Use outcome ranges or expected variability."
  },
  {
    regex: /\bclick now now now\b/gi,
    replacement: "take a moment to review details before checkout",
    recommendation: "Remove repetitive pressure phrases and encourage informed purchase decisions."
  },
  {
    regex: /\bno need to ask for proof\b/gi,
    replacement: "you are welcome to ask for proof and documentation",
    recommendation: "Invite verification requests to increase buyer trust."
  },
  {
    regex: /\bonly for the next \d+ seconds\b/gi,
    replacement: "promo is time-limited, with terms shown transparently on-screen",
    recommendation: "If urgency is real, show transparent promo terms and countdown source."
  }
];

export function rewriteSellerPitch(input: string): RewriteResult {
  let rewritten = input;
  const riskyPhrases: string[] = [];
  const recommendations: string[] = [];
  let changes = 0;

  rewriteRules.forEach((rule) => {
    rule.regex.lastIndex = 0;
    if (rule.regex.test(rewritten)) {
      riskyPhrases.push(rule.regex.source);
      recommendations.push(rule.recommendation);
      rule.regex.lastIndex = 0;
      rewritten = rewritten.replace(rule.regex, rule.replacement);
      changes += 1;
    }
  });

  const trustImprovementScore = Math.min(100, 45 + changes * 14);

  return {
    riskyPhrases,
    rewrittenPitch: rewritten,
    trustImprovementScore,
    recommendations: Array.from(new Set(recommendations))
  };
}

/**
 * AI integration note:
 * Replace with a policy-constrained rewrite model that preserves seller intent while
 * removing deceptive language and citing missing evidence.
 */
