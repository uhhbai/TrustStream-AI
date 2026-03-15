import { ClaimMatch, ClaimType, LivestreamSession, TranscriptLine } from "@/types";

interface ClaimRule {
  type: ClaimType;
  regex: RegExp;
  baseScore: number;
  rationale: string;
}

const CLAIM_RULES: ClaimRule[] = [
  {
    type: "authenticity",
    regex:
      /\b(100%\s*original|official brand item|authentic|genuine|authorized reseller|original set)\b/i,
    baseScore: 78,
    rationale: "Authenticity or official-source claim detected."
  },
  {
    type: "certification",
    regex: /\b(dermatologist tested|fda approved|lab tested|clinically tested|certified)\b/i,
    baseScore: 80,
    rationale: "Regulatory or professional certification claim detected."
  },
  {
    type: "returns",
    regex:
      /\b(free returns?|full refund|money[- ]back|no questions asked return|easy return|refund guaranteed)\b/i,
    baseScore: 72,
    rationale: "Return or refund promise detected."
  },
  {
    type: "results",
    regex:
      /\b(guaranteed results?|works instantly|never fails|proven to work|best results)\b/i,
    baseScore: 76,
    rationale: "Performance or outcome guarantee claim detected."
  },
  {
    type: "stock",
    regex: /\b(limited stock|only \d+\s*(pieces|sets|left)|last \d+\s*(units|slots))\b/i,
    baseScore: 66,
    rationale: "Low inventory or scarcity claim detected."
  },
  {
    type: "urgency",
    regex:
      /\b(ends in \d+\s*(seconds?|minutes?)|next \d+\s*seconds?|buy now|today only|checkout now)\b/i,
    baseScore: 67,
    rationale: "Time pressure or urgency sales claim detected."
  },
  {
    type: "price",
    regex:
      /\b(from\s*[$]?\d+(?:\.\d+)?\s*(?:to|-)\s*[$]?\d+(?:\.\d+)?|\d{1,3}%\s*off|half price)\b/i,
    baseScore: 70,
    rationale: "Discount or price-drop claim detected."
  }
];

const HIGH_CONFIDENCE_CUES =
  /\b(100%|official|approved|certified|guaranteed|never fails|no questions asked)\b/i;
const LOW_CONFIDENCE_CUES = /\b(maybe|might|usually|likely|most users|some users)\b/i;

function sliceLines(session: LivestreamSession, lineLimit?: number) {
  return lineLimit ? session.transcript.slice(0, lineLimit) : session.transcript;
}

function toConfidence(score: number): "High" | "Medium" | "Low" {
  if (score >= 78) return "High";
  if (score >= 58) return "Medium";
  return "Low";
}

function scoreClaim(lineText: string, baseScore: number) {
  let score = baseScore;

  if (HIGH_CONFIDENCE_CUES.test(lineText)) score += 10;
  if (LOW_CONFIDENCE_CUES.test(lineText)) score -= 14;
  if (lineText.length > 145) score -= 4;

  return Math.max(0, Math.min(100, score));
}

function extractSnippet(line: TranscriptLine, regex: RegExp) {
  regex.lastIndex = 0;
  const matched = regex.exec(line.text);
  if (!matched) return { claimText: line.text, matchedText: undefined };

  const token = matched[0];
  const start = Math.max(0, matched.index - 28);
  const end = Math.min(line.text.length, matched.index + token.length + 28);
  return {
    claimText: line.text.slice(start, end).trim(),
    matchedText: token.trim()
  };
}

export function detectClaims(session: LivestreamSession, lineLimit?: number): ClaimMatch[] {
  const lines = sliceLines(session, lineLimit);
  const matches: ClaimMatch[] = [];
  const seen = new Set<string>();

  lines.forEach((line) => {
    CLAIM_RULES.forEach((rule) => {
      rule.regex.lastIndex = 0;
      if (!rule.regex.test(line.text)) return;

      const dedupeKey = `${line.id}:${rule.type}`;
      if (seen.has(dedupeKey)) return;
      seen.add(dedupeKey);

      const score = scoreClaim(line.text, rule.baseScore);
      const snippet = extractSnippet(line, rule.regex);

      matches.push({
        id: `${line.id}-${rule.type}`,
        sessionId: session.id,
        lineId: line.id,
        claimText: snippet.claimText,
        claimType: rule.type,
        confidence: toConfidence(score),
        matchedText: snippet.matchedText,
        rationale: rule.rationale
      });
    });
  });

  return matches;
}

/**
 * AI integration note:
 * Replace the claim rules with structured extraction from an LLM call while keeping
 * the ClaimMatch shape stable for UI compatibility.
 */
