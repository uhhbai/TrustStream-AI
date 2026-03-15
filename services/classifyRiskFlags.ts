import { LivestreamSession, RiskFlag } from "@/types";
import { RISK_PATTERNS } from "@/services/patterns";

export function classifyRiskFlags(session: LivestreamSession, lineLimit?: number): RiskFlag[] {
  const lines = lineLimit ? session.transcript.slice(0, lineLimit) : session.transcript;
  const riskFlags: RiskFlag[] = [];

  lines.forEach((line) => {
    RISK_PATTERNS.forEach((pattern) => {
      if (pattern.regex.test(line.text)) {
        riskFlags.push({
          id: `${line.id}-${pattern.type}`,
          sessionId: session.id,
          lineId: line.id,
          riskType: pattern.type,
          severity: pattern.severity,
          reason: pattern.reason,
          confidence: pattern.confidence
        });
      }
    });
  });

  return riskFlags;
}

/**
 * AI integration note:
 * This can later call a real risk classifier model that includes contextual signals
 * (seller history, chat sentiment, visual cues, and policy taxonomies).
 */
