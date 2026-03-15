interface RewriteRule {
  label: string;
  regex: RegExp;
  replacement: string;
  recommendation: string;
  riskWeight: number;
}

interface RewriteResult {
  riskyPhrases: string[];
  rewrittenPitch: string;
  trustImprovementScore: number;
  recommendations: string[];
}

const REWRITE_RULES: RewriteRule[] = [
  {
    label: "absolute_authenticity",
    regex: /\b(100%\s*original|official brand item|totally authentic)\b/gi,
    replacement: "sourced from our listed supplier, and proof can be shown on-screen",
    recommendation: "Swap absolute authenticity claims for verifiable sourcing statements.",
    riskWeight: 16
  },
  {
    label: "hard_guarantee",
    regex: /\b(guaranteed results?|never fails|always works|instant results)\b/gi,
    replacement: "results vary by user, and we can explain expected outcomes transparently",
    recommendation: "Avoid absolute result promises; describe realistic outcomes and limitations.",
    riskWeight: 15
  },
  {
    label: "aggressive_urgency",
    regex: /\b(click now now now|buy now now|checkout now)\b/gi,
    replacement: "please review details before checkout",
    recommendation: "Replace pressure commands with informed decision prompts.",
    riskWeight: 14
  },
  {
    label: "proof_discouragement",
    regex: /\b(no need to ask for proof|just trust me)\b/gi,
    replacement: "you are welcome to ask for proof before purchasing",
    recommendation: "Encourage verification requests to build trust.",
    riskWeight: 16
  },
  {
    label: "hard_countdown",
    regex: /\b(only for the next \d+\s*(seconds?|minutes?)|ends in \d+\s*(seconds?|minutes?))\b/gi,
    replacement: "limited-time promo with terms shown clearly in-stream",
    recommendation: "Use urgency only with transparent and verifiable promo terms.",
    riskWeight: 12
  },
  {
    label: "refund_conflict",
    regex: /\b(no refunds?|no returns?)\b/gi,
    replacement: "returns are handled based on clearly stated policy terms",
    recommendation: "State return policy clearly and avoid absolute no-refund wording.",
    riskWeight: 12
  }
];

function normalizeSpacing(text: string) {
  return text.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}

export function rewriteSellerPitch(input: string): RewriteResult {
  let rewritten = input;
  const riskyPhrases: string[] = [];
  const recommendations: string[] = [];
  let totalRiskReduced = 0;

  REWRITE_RULES.forEach((rule) => {
    rule.regex.lastIndex = 0;
    if (!rule.regex.test(rewritten)) return;

    rule.regex.lastIndex = 0;
    const found = rewritten.match(rule.regex) ?? [];
    found.forEach((phrase) => riskyPhrases.push(phrase));
    recommendations.push(rule.recommendation);

    rewritten = rewritten.replace(rule.regex, rule.replacement);
    totalRiskReduced += rule.riskWeight;
  });

  if (!/\b(invoice|proof|policy|certificate|documentation)\b/i.test(rewritten)) {
    rewritten = `${normalizeSpacing(rewritten)}\nWe can show invoice, certification, and return policy details live before checkout.`;
    recommendations.push("Add one explicit line offering proof visibility during livestream.");
    totalRiskReduced += 8;
  }

  rewritten = normalizeSpacing(rewritten);

  const trustImprovementScore = Math.max(
    35,
    Math.min(98, 40 + Math.round(totalRiskReduced * 1.4))
  );

  return {
    riskyPhrases: Array.from(new Set(riskyPhrases)),
    rewrittenPitch: rewritten,
    trustImprovementScore,
    recommendations: Array.from(new Set(recommendations))
  };
}

/**
 * AI integration note:
 * Replace this rule-based rewriter with a constrained LLM rewrite step that
 * preserves seller intent while enforcing trust-and-safety policy style.
 */
