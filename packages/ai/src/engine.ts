import {
  ClaimCategory,
  ClaimResult,
  ConfidenceLabel,
  EvidenceStatus,
  RiskFlagResult,
  RiskType,
  SessionSummary,
  TrustScoreBreakdown
} from "@truststream/shared";
import { AnalysisContext, ChunkAnalysisResult } from "./types";

interface ClaimPattern {
  category: ClaimCategory;
  regex: RegExp;
  reasoning: string;
  baseConfidence: number;
}

interface RiskPattern {
  riskType: RiskType;
  regex: RegExp;
  reasoning: string;
  severity: "low" | "medium" | "high";
  baseConfidence: number;
}

const CLAIM_PATTERNS: ClaimPattern[] = [
  {
    category: "authenticity",
    regex: /\b(100%\s*original|official authentic|official brand item|authentic)\b/i,
    reasoning: "Absolute authenticity language detected.",
    baseConfidence: 0.83
  },
  {
    category: "certification",
    regex: /\b(FDA approved|dermatologist tested|clinically tested|certified)\b/i,
    reasoning: "Certification or authority claim detected.",
    baseConfidence: 0.84
  },
  {
    category: "urgency",
    regex: /\b(only \d+ left|buy now before|today only|ends in \d+)\b/i,
    reasoning: "Urgency scarcity phrasing detected.",
    baseConfidence: 0.76
  },
  {
    category: "returns",
    regex: /\b(free returns?|no questions asked|full refund|money back)\b/i,
    reasoning: "Refund/return policy claim detected.",
    baseConfidence: 0.78
  },
  {
    category: "results",
    regex: /\b(guaranteed results?|works instantly|never fails)\b/i,
    reasoning: "Outcome guarantee claim detected.",
    baseConfidence: 0.81
  },
  {
    category: "price",
    regex: /\b(\d{1,3}%\s*off|from\s*[$]?\d+\s*(?:to|-)\s*[$]?\d+)\b/i,
    reasoning: "Discount or major price-drop language detected.",
    baseConfidence: 0.8
  }
];

const RISK_PATTERNS: RiskPattern[] = [
  {
    riskType: "fake_urgency",
    regex: /\b(ends in \d+|next \d+ seconds|only \d+ left|now now now)\b/i,
    reasoning: "Countdown or scarcity pressure likely manipulative.",
    severity: "high",
    baseConfidence: 0.85
  },
  {
    riskType: "exaggerated_guarantee",
    regex: /\b(guaranteed results?|never fails|always works)\b/i,
    reasoning: "Absolute performance promise can be misleading.",
    severity: "high",
    baseConfidence: 0.83
  },
  {
    riskType: "suspicious_discount",
    regex: /\b(\d{2,3}%\s*off|from\s*[$]?\d+\s*(?:to|-)\s*[$]?\d+)\b/i,
    reasoning: "Deep discount anchor may indicate deceptive pricing.",
    severity: "medium",
    baseConfidence: 0.8
  },
  {
    riskType: "unverifiable_authenticity",
    regex: /\b(100%\s*original|official authentic|trust me)\b/i,
    reasoning: "Authenticity asserted without immediate proof context.",
    severity: "high",
    baseConfidence: 0.82
  },
  {
    riskType: "pressure_tactic",
    regex: /\b(buy now|checkout now|do not miss|regret)\b/i,
    reasoning: "Pushy action language detected.",
    severity: "medium",
    baseConfidence: 0.76
  }
];

const QUESTION_BY_CATEGORY: Record<ClaimCategory, string> = {
  authenticity: "Can you show an official invoice or brand authorization letter now?",
  certification: "Can you show the certificate number and issuing authority on screen?",
  urgency: "Can you confirm whether the stock/countdown is platform-verified?",
  returns: "Can you show the exact written return policy from checkout terms?",
  results: "What evidence supports this outcome beyond testimonials?",
  price: "Can you show price history for this item before this stream?",
  stock: "Can you show live inventory evidence from your seller dashboard?"
};

function scoreToLabel(score: number): ConfidenceLabel {
  if (score >= 0.8) return "High";
  if (score >= 0.62) return "Medium";
  return "Low";
}

function toSnippet(text: string, found: string) {
  const index = text.toLowerCase().indexOf(found.toLowerCase());
  if (index < 0) return text;
  return text.slice(Math.max(0, index - 26), Math.min(text.length, index + found.length + 36)).trim();
}

function findAllMatches(regex: RegExp, text: string): string[] {
  const globalRegex = new RegExp(regex.source, "gi");
  const values: string[] = [];
  let match = globalRegex.exec(text);
  while (match) {
    values.push(match[0]);
    match = globalRegex.exec(text);
  }
  return values;
}

function strictBoost(context: AnalysisContext) {
  return context.sensitivity === "strict" ? 0.08 : context.sensitivity === "conservative" ? -0.06 : 0;
}

export function detectClaims(transcriptChunk: string, context: AnalysisContext): ClaimResult[] {
  const claims: ClaimResult[] = [];
  const boost = strictBoost(context);
  let sequence = 0;

  CLAIM_PATTERNS.forEach((pattern) => {
    const matches = findAllMatches(pattern.regex, transcriptChunk);
    matches.forEach((matched) => {
      sequence += 1;
      let confidence = pattern.baseConfidence + boost;
      if (/\b(100%|official|guaranteed|FDA|no questions asked)\b/i.test(transcriptChunk)) confidence += 0.06;
      if (/\b(maybe|might|usually|can help)\b/i.test(transcriptChunk)) confidence -= 0.15;
      if (matched.length < 7) confidence -= 0.05;

      const clamped = Math.max(0, Math.min(1, confidence));
      claims.push({
        id: `${context.chunkId}-${pattern.category}-${sequence}`,
        chunkId: context.chunkId,
        claimText: toSnippet(transcriptChunk, matched),
        claimCategory: pattern.category,
        confidence: scoreToLabel(clamped),
        evidenceStatus: "evidence_unclear",
        reasoning: pattern.reasoning,
        recommendedQuestion: QUESTION_BY_CATEGORY[pattern.category]
      });
    });
  });

  return claims.slice(0, 10);
}

function parseAnchoredDiscount(text: string) {
  const anchored = /from\s*[$]?(\d{1,4})\s*(?:to|-)\s*[$]?(\d{1,4})/i.exec(text);
  if (!anchored) return undefined;

  const before = Number(anchored[1]);
  const after = Number(anchored[2]);
  if (!Number.isFinite(before) || !Number.isFinite(after) || before <= after) return undefined;

  return Math.round(((before - after) / before) * 100);
}

export function classifyRiskFlags(transcriptChunk: string, context: AnalysisContext): RiskFlagResult[] {
  const risks: RiskFlagResult[] = [];
  const boost = strictBoost(context);

  RISK_PATTERNS.forEach((pattern) => {
    const matches = findAllMatches(pattern.regex, transcriptChunk);
    matches.forEach((matched, index) => {
      let confidence = pattern.baseConfidence + boost;
      if (pattern.riskType === "suspicious_discount") {
        const rate = parseAnchoredDiscount(transcriptChunk);
        if (typeof rate === "number" && rate >= 70) confidence += 0.08;
      }

      if (/\b(now now now|urgent|last chance)\b/i.test(transcriptChunk)) {
        confidence += 0.05;
      }

      risks.push({
        id: `${context.chunkId}-${pattern.riskType}-${index + 1}`,
        chunkId: context.chunkId,
        riskType: pattern.riskType,
        severity: pattern.severity,
        confidence: scoreToLabel(Math.max(0, Math.min(1, confidence))),
        triggerText: matched,
        reasoning: `${pattern.reasoning} Trigger phrase: "${matched}".`
      });
    });
  });

  if (
    /\b(free returns?|full refund)\b/i.test(transcriptChunk) &&
    /\b(no refunds?|no returns?)\b/i.test(transcriptChunk)
  ) {
    risks.push({
      id: `${context.chunkId}-contradictory-refund`,
      chunkId: context.chunkId,
      riskType: "contradictory_statement",
      severity: "high",
      confidence: "High",
      triggerText: "Refund contradiction in same chunk",
      reasoning: "Contradictory refund statements reduce trust and clarity."
    });
  }

  const windowText = context.transcriptWindow.join(" ").toLowerCase();
  const urgencyBurst =
    (windowText.match(/\b(buy now|checkout now|only \d+ left|ends in \d+|next \d+ seconds)\b/g) ?? [])
      .length;
  if (urgencyBurst >= 3) {
    risks.push({
      id: `${context.chunkId}-urgency-burst`,
      chunkId: context.chunkId,
      riskType: "fake_urgency",
      severity: "high",
      confidence: "High",
      triggerText: `${urgencyBurst} urgency phrases in recent transcript window`,
      reasoning:
        "Repeated urgency phrases across consecutive chunks suggest pressure-based persuasion rather than informative selling."
    });
  }

  if (
    /\b(100%\s*original|official authentic|authentic)\b/i.test(windowText) &&
    !/\b(invoice|certificate|proof|authorized distributor)\b/i.test(windowText)
  ) {
    risks.push({
      id: `${context.chunkId}-auth-without-proof-window`,
      chunkId: context.chunkId,
      riskType: "unverifiable_authenticity",
      severity: "high",
      confidence: "High",
      triggerText: "Authenticity repeatedly claimed without proof language",
      reasoning:
        "The transcript repeatedly claims authenticity but no verifiable proof terms were detected in the same context window."
    });
  }

  const deduped = new Map<string, RiskFlagResult>();
  risks.forEach((risk) => {
    const key = `${risk.riskType}:${risk.triggerText}`;
    if (!deduped.has(key)) {
      deduped.set(key, risk);
    }
  });

  return Array.from(deduped.values()).slice(0, 10);
}

export function matchEvidence(
  claims: ClaimResult[],
  visiblePageData?: AnalysisContext["visiblePageData"],
  sellerData?: AnalysisContext["sellerSignals"],
  productData?: { hasInvoice?: boolean; hasCertificate?: boolean; hasReturnPolicy?: boolean }
): ClaimResult[] {
  return claims.map((claim) => {
    let evidenceStatus: EvidenceStatus = "evidence_unclear";
    const sourceText = [
      visiblePageData?.productName,
      visiblePageData?.sellerLabel,
      visiblePageData?.listedPrice,
      ...(visiblePageData?.extraText ?? [])
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    if (claim.claimCategory === "authenticity") {
      if (productData?.hasInvoice || /\b(invoice|authorized)\b/.test(sourceText)) {
        evidenceStatus = "shown";
      } else if (sellerData?.verified) {
        evidenceStatus = "evidence_unclear";
      } else {
        evidenceStatus = "not_verified";
      }
    } else if (claim.claimCategory === "certification") {
      evidenceStatus =
        productData?.hasCertificate || /\b(certificate|lab report|fda)\b/.test(sourceText)
          ? "shown"
          : "not_verified";
    } else if (claim.claimCategory === "returns") {
      evidenceStatus =
        productData?.hasReturnPolicy || /\b(return policy|refund terms)\b/.test(sourceText)
          ? "shown"
          : "evidence_unclear";
    } else if (claim.claimCategory === "price") {
      evidenceStatus = /\b(price|discount|msrp)\b/.test(sourceText) ? "evidence_unclear" : "not_verified";
    } else {
      evidenceStatus = /\bshown|demo|proof|evidence\b/.test(sourceText) ? "shown" : "evidence_unclear";
    }

    return {
      ...claim,
      evidenceStatus
    };
  });
}

export function generateBuyerQuestions(claims: ClaimResult[], risks: RiskFlagResult[]): string[] {
  const questions: string[] = [];

  claims
    .filter((claim) => claim.evidenceStatus !== "shown")
    .forEach((claim) => questions.push(claim.recommendedQuestion));

  risks.forEach((risk) => {
    if (risk.riskType === "fake_urgency") {
      questions.push("Can you keep the offer open briefly so buyers can verify details?");
    }
    if (risk.riskType === "suspicious_discount") {
      questions.push("Can you show why this discount is unusually deep today?");
    }
    if (risk.riskType === "contradictory_statement") {
      questions.push("Which policy is final, and can you show it on-screen now?");
    }
  });

  if (questions.length === 0) {
    questions.push("Can you summarize proof documents and return terms before checkout?");
  }

  return Array.from(new Set(questions)).slice(0, 5);
}

function trustLabel(score: number): "trusted" | "caution" | "high_risk" {
  if (score >= 75) return "trusted";
  if (score >= 45) return "caution";
  return "high_risk";
}

export function calculateTrustScore(
  claims: ClaimResult[],
  riskFlags: RiskFlagResult[],
  sellerSignals?: AnalysisContext["sellerSignals"]
): TrustScoreBreakdown {
  if (claims.length === 0 && riskFlags.length === 0) {
    return {
      score: 50,
      label: "caution",
      confidence: "Low",
      explanation: {
        positiveSignals: [],
        negativeSignals: [
          "Insufficient transcript evidence captured so far. Score is provisional."
        ],
        weightedFactors: {
          provisionalBaseline: 50
        }
      }
    };
  }

  const shownEvidence = claims.filter((c) => c.evidenceStatus === "shown").length;
  const unclearEvidence = claims.filter((c) => c.evidenceStatus === "evidence_unclear").length;
  const notVerified = claims.filter((c) => c.evidenceStatus === "not_verified").length;

  const verifiableEvidenceBoost = shownEvidence * 9;
  const transparencyBoost = Math.max(0, shownEvidence * 4 - unclearEvidence * 2);

  const negativeRisk = riskFlags.reduce((sum, risk) => {
    if (risk.severity === "high") return sum + 14;
    if (risk.severity === "medium") return sum + 9;
    return sum + 4;
  }, 0);

  const missingProofPenalty = notVerified * 10 + Math.max(0, unclearEvidence - shownEvidence) * 4;
  const sellerCredibility = sellerSignals?.verified ? 8 : -4;
  const historyPenalty = (sellerSignals?.historyRiskCount ?? 0) * 2;

  const raw =
    60 + verifiableEvidenceBoost + transparencyBoost + sellerCredibility - negativeRisk - missingProofPenalty - historyPenalty;
  const score = Math.max(0, Math.min(100, Math.round(raw)));

  const positiveSignals: string[] = [];
  const negativeSignals: string[] = [];

  if (shownEvidence > 0) positiveSignals.push(`${shownEvidence} claim(s) had visible supporting signals.`);
  if (sellerSignals?.verified) positiveSignals.push("Seller account appears verified.");
  if (riskFlags.length === 0) positiveSignals.push("No major manipulation patterns detected in this window.");

  if (notVerified > 0) negativeSignals.push(`${notVerified} claim(s) lacked verifiable proof.`);
  if (riskFlags.length > 0) negativeSignals.push(`${riskFlags.length} risk flag(s) detected.`);
  if ((sellerSignals?.historyRiskCount ?? 0) > 0) negativeSignals.push("Seller historical risk records impacted score.");

  return {
    score,
    label: trustLabel(score),
    confidence: claims.length >= 3 ? "High" : claims.length >= 1 ? "Medium" : "Low",
    explanation: {
      positiveSignals,
      negativeSignals,
      weightedFactors: {
        verifiableEvidenceBoost,
        transparencyBoost,
        sellerCredibility,
        negativeRisk: -negativeRisk,
        missingProofPenalty: -missingProofPenalty,
        historyPenalty: -historyPenalty
      }
    }
  };
}

export function updateSessionSummary(
  existingSummary: SessionSummary | undefined,
  newChunkAnalysis: Pick<ChunkAnalysisResult, "claims" | "riskFlags" | "suggestedQuestions" | "trustScore">
): SessionSummary {
  const previous = existingSummary ?? {
    rollingSummary: "Session started. Waiting for enough transcript context.",
    buyerGuidance: [],
    keyChanges: []
  };

  const keyChanges: string[] = [];
  if (newChunkAnalysis.claims.length > 0) {
    keyChanges.push(
      `Detected new claim categories: ${Array.from(
        new Set(newChunkAnalysis.claims.map((c) => c.claimCategory))
      ).join(", ")}.`
    );
  }
  if (newChunkAnalysis.riskFlags.length > 0) {
    keyChanges.push(
      `Risk update: ${newChunkAnalysis.riskFlags
        .map((r) => `${r.riskType} (${r.triggerText})`)
        .join(", ")}.`
    );
  }
  keyChanges.push(`Trust score now ${newChunkAnalysis.trustScore.score} (${newChunkAnalysis.trustScore.label}).`);

  return {
    rollingSummary:
      keyChanges.length > 0
        ? keyChanges.join(" ")
        : previous.rollingSummary,
    buyerGuidance: Array.from(new Set([...newChunkAnalysis.suggestedQuestions, ...previous.buyerGuidance])).slice(0, 5),
    keyChanges: Array.from(new Set([...keyChanges, ...previous.keyChanges])).slice(0, 6)
  };
}

export function rewriteSellerPitch(text: string): {
  rewrittenPitch: string;
  changes: string[];
  trustImprovementScore: number;
} {
  const rewriteRules = [
    {
      regex: /\b100%\s*original\b/gi,
      replacement: "sourced from our supplier with proof available live",
      note: "Replaced absolute authenticity language with verifiable wording."
    },
    {
      regex: /\bguaranteed results?\b/gi,
      replacement: "results vary by user and usage conditions",
      note: "Removed absolute guarantee wording."
    },
    {
      regex: /\bbuy now before it'?s gone\b/gi,
      replacement: "please review details before checkout",
      note: "Reduced pressure tactic language."
    },
    {
      regex: /\bno questions asked\b/gi,
      replacement: "under documented return terms",
      note: "Clarified policy wording."
    }
  ];

  let rewritten = text;
  const changes: string[] = [];
  let delta = 0;

  rewriteRules.forEach((rule) => {
    rule.regex.lastIndex = 0;
    if (!rule.regex.test(rewritten)) return;

    rule.regex.lastIndex = 0;
    rewritten = rewritten.replace(rule.regex, rule.replacement);
    changes.push(rule.note);
    delta += 18;
  });

  if (!/\b(proof|invoice|certificate|policy)\b/i.test(rewritten)) {
    rewritten = `${rewritten}\nProof of invoice, certification, and return policy can be shown live on request.`;
    changes.push("Added explicit evidence-offer sentence.");
    delta += 10;
  }

  return {
    rewrittenPitch: rewritten.trim(),
    changes: Array.from(new Set(changes)),
    trustImprovementScore: Math.max(35, Math.min(95, 40 + delta))
  };
}
