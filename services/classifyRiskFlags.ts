import { LivestreamSession, RiskFlag, RiskSeverity, RiskType, TranscriptLine } from "@/types";

interface RiskRule {
  riskType: RiskType;
  regex: RegExp;
  severity: RiskSeverity;
  confidence: "High" | "Medium" | "Low";
  reason: string;
}

const URGENCY_RULES: RiskRule[] = [
  {
    riskType: "fake_urgency",
    regex: /\b(next \d+\s*seconds?|ends in \d+\s*(seconds?|minutes?)|vanishes every second)\b/i,
    severity: "high",
    confidence: "High",
    reason: "Artificial countdown pressure can force rushed buyer decisions."
  },
  {
    riskType: "pressure_tactic",
    regex: /\b(click now|buy now|checkout now|don'?t miss|regret)\b/i,
    severity: "medium",
    confidence: "Medium",
    reason: "Repetitive action prompts prioritize pressure over clarity."
  }
];

const AUTHENTICITY_RISK_RULES: RiskRule[] = [
  {
    riskType: "unverifiable_authenticity",
    regex: /\b(100%\s*original|official brand item|authentic)\b/i,
    severity: "high",
    confidence: "High",
    reason: "Authenticity is asserted in absolute terms and needs verifiable proof."
  },
  {
    riskType: "unverifiable_authenticity",
    regex: /\b(no need to ask for proof|just trust me)\b/i,
    severity: "high",
    confidence: "High",
    reason: "Seller discourages verification while making authenticity claims."
  }
];

const REFUND_RISK_RULES: RiskRule[] = [
  {
    riskType: "refund_policy_conflict",
    regex: /\b(free returns?|full refund|money[- ]back)\b/i,
    severity: "medium",
    confidence: "Medium",
    reason: "Refund promise detected and should be checked against policy terms."
  },
  {
    riskType: "refund_policy_conflict",
    regex: /\b(no refunds?|no returns?)\b/i,
    severity: "high",
    confidence: "High",
    reason: "Strict no-refund wording may conflict with earlier buyer-friendly promises."
  }
];

const GUARANTEE_RULES: RiskRule[] = [
  {
    riskType: "exaggerated_guarantee",
    regex: /\b(guaranteed results?|never fails|always works|instant results)\b/i,
    severity: "high",
    confidence: "High",
    reason: "Absolute performance outcomes are difficult to justify reliably."
  },
  {
    riskType: "emotional_manipulation",
    regex: /\b(your family|everyone else already checked out|you will regret)\b/i,
    severity: "medium",
    confidence: "Medium",
    reason: "Emotional triggers are being used to drive urgency."
  }
];

function sliceLines(session: LivestreamSession, lineLimit?: number) {
  return lineLimit ? session.transcript.slice(0, lineLimit) : session.transcript;
}

function extractTrigger(line: TranscriptLine, regex: RegExp) {
  regex.lastIndex = 0;
  const matched = regex.exec(line.text);
  return matched?.[0]?.trim();
}

function createFlag(session: LivestreamSession, line: TranscriptLine, rule: RiskRule): RiskFlag {
  return {
    id: `${line.id}-${rule.riskType}`,
    sessionId: session.id,
    lineId: line.id,
    riskType: rule.riskType,
    severity: rule.severity,
    reason: rule.reason,
    confidence: rule.confidence,
    triggerText: extractTrigger(line, rule.regex)
  };
}

function detectByRules(session: LivestreamSession, rules: RiskRule[], lineLimit?: number): RiskFlag[] {
  const lines = sliceLines(session, lineLimit);
  const found: RiskFlag[] = [];

  lines.forEach((line) => {
    rules.forEach((rule) => {
      rule.regex.lastIndex = 0;
      if (!rule.regex.test(line.text)) return;
      found.push(createFlag(session, line, rule));
    });
  });

  return found;
}

function parseDiscount(lineText: string) {
  const anchored =
    /from\s*[$]?(\d{1,3}(?:,\d{3})*(?:\.\d+)?)\s*(?:to|-)\s*[$]?(\d{1,3}(?:,\d{3})*(?:\.\d+)?)/i.exec(
      lineText
    );
  if (anchored) {
    const before = Number(anchored[1].replace(/,/g, ""));
    const after = Number(anchored[2].replace(/,/g, ""));
    if (before > 0 && after > 0 && before > after) {
      const discountRate = Math.round(((before - after) / before) * 100);
      return { before, after, discountRate };
    }
  }

  const percent = /(\d{1,3})\s*%\s*off/i.exec(lineText);
  if (percent) {
    const discountRate = Number(percent[1]);
    return { before: undefined, after: undefined, discountRate };
  }

  return undefined;
}

export function detectUrgencyManipulation(
  session: LivestreamSession,
  lineLimit?: number
): RiskFlag[] {
  const lines = sliceLines(session, lineLimit);
  const flags = detectByRules(session, URGENCY_RULES, lineLimit);

  lines.forEach((line) => {
    const repeatedNow = line.text.match(/\bnow\b/gi)?.length ?? 0;
    if (repeatedNow >= 3) {
      flags.push({
        id: `${line.id}-pressure-repeat-now`,
        sessionId: session.id,
        lineId: line.id,
        riskType: "pressure_tactic",
        severity: "high",
        reason: "Repeated 'now' phrasing indicates aggressive pressure tactics.",
        confidence: "High",
        triggerText: "now now now"
      });
    }
  });

  return flags;
}

export function detectAuthenticityClaimRisk(
  session: LivestreamSession,
  lineLimit?: number
): RiskFlag[] {
  return detectByRules(session, AUTHENTICITY_RISK_RULES, lineLimit);
}

export function detectRefundReturnRisk(
  session: LivestreamSession,
  lineLimit?: number
): RiskFlag[] {
  const lines = sliceLines(session, lineLimit);
  const baseFlags = detectByRules(session, REFUND_RISK_RULES, lineLimit);

  const hasPositivePromise = lines.some((line) => /\b(free returns?|full refund|money[- ]back)\b/i.test(line.text));
  const hasHardDenial = lines.some((line) => /\b(no refunds?|no returns?)\b/i.test(line.text));

  if (hasPositivePromise && hasHardDenial) {
    baseFlags.push({
      id: `${session.id}-refund-conflict`,
      sessionId: session.id,
      lineId: lines[lines.length - 1]?.id ?? `${session.id}-line`,
      riskType: "refund_policy_conflict",
      severity: "high",
      reason: "The stream contains both refund-friendly and no-refund language, creating policy conflict.",
      confidence: "High",
      triggerText: "refund policy contradiction"
    });
  }

  return baseFlags;
}

export function detectSuspiciousDiscounts(
  session: LivestreamSession,
  lineLimit?: number
): RiskFlag[] {
  const lines = sliceLines(session, lineLimit);
  const flags: RiskFlag[] = [];

  lines.forEach((line) => {
    const parsed = parseDiscount(line.text);
    if (!parsed) return;

    const highDrop = parsed.discountRate >= 75;
    flags.push({
      id: `${line.id}-deep-discount`,
      sessionId: session.id,
      lineId: line.id,
      riskType: "deep_discount_pressure",
      severity: highDrop ? "high" : "medium",
      reason: highDrop
        ? `Very steep discount detected (${parsed.discountRate}% off), which may indicate manipulative anchoring.`
        : `Large discount detected (${parsed.discountRate}% off); buyer should verify baseline price.`,
      confidence: highDrop ? "High" : "Medium",
      triggerText: parsed.before && parsed.after ? `${parsed.before} -> ${parsed.after}` : `${parsed.discountRate}% off`
    });
  });

  return flags;
}

export function classifyRiskFlags(session: LivestreamSession, lineLimit?: number): RiskFlag[] {
  const combined = [
    ...detectUrgencyManipulation(session, lineLimit),
    ...detectAuthenticityClaimRisk(session, lineLimit),
    ...detectRefundReturnRisk(session, lineLimit),
    ...detectSuspiciousDiscounts(session, lineLimit),
    ...detectByRules(session, GUARANTEE_RULES, lineLimit)
  ];

  const deduped = new Map<string, RiskFlag>();
  combined.forEach((flag) => {
    const key = `${flag.lineId}:${flag.riskType}:${flag.triggerText ?? ""}`;
    if (!deduped.has(key)) {
      deduped.set(key, flag);
    }
  });

  return Array.from(deduped.values());
}

/**
 * AI integration note:
 * Replace these deterministic detectors with policy-aware model classifiers while
 * preserving RiskFlag fields for UI consistency.
 */
