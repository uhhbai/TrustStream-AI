import { ClaimMatch, LivestreamSession } from "@/types";
import { CLAIM_PATTERNS } from "@/services/patterns";

export function detectClaims(session: LivestreamSession, lineLimit?: number): ClaimMatch[] {
  const lines = lineLimit ? session.transcript.slice(0, lineLimit) : session.transcript;
  const matches: ClaimMatch[] = [];

  lines.forEach((line) => {
    CLAIM_PATTERNS.forEach((pattern) => {
      if (pattern.regex.test(line.text)) {
        matches.push({
          id: `${line.id}-${pattern.type}`,
          sessionId: session.id,
          lineId: line.id,
          claimText: line.text,
          claimType: pattern.type,
          confidence: pattern.confidence
        });
      }
    });
  });

  return matches;
}

/**
 * AI integration note:
 * Replace this rule engine with an LLM + moderation pipeline that extracts claims and confidence.
 * Keep the same return shape so UI components do not change.
 */
