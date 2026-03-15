import { ClaimType, RiskType } from "@/types";

export interface ClaimPattern {
  type: ClaimType;
  regex: RegExp;
  confidence: "High" | "Medium" | "Low";
}

export interface RiskPattern {
  type: RiskType;
  regex: RegExp;
  severity: "low" | "medium" | "high";
  reason: string;
  confidence: "High" | "Medium" | "Low";
}

export const CLAIM_PATTERNS: ClaimPattern[] = [
  { type: "authenticity", regex: /\b100%\s*original\b|\bofficial brand item\b/i, confidence: "High" },
  {
    type: "certification",
    regex: /\bdermatologist tested\b|\bFDA approved\b/i,
    confidence: "High"
  },
  { type: "stock", regex: /\blimited stock\b|\bonly \d+ .*left\b/i, confidence: "Medium" },
  { type: "returns", regex: /\bfree returns?\b|\brefund/i, confidence: "Medium" },
  { type: "results", regex: /\bguaranteed results?\b|\bnever fails\b/i, confidence: "High" },
  { type: "urgency", regex: /\bends in \d+|\bnext \d+ seconds\b/i, confidence: "Medium" },
  { type: "price", regex: /\bfrom \d+.* to \d+/i, confidence: "Low" }
];

export const RISK_PATTERNS: RiskPattern[] = [
  {
    type: "fake_urgency",
    regex: /\bnext \d+ seconds\b|\bends in \d+ minutes?\b|\bvanishes every second\b/i,
    severity: "high",
    reason: "Countdown-based urgency may pressure buyers into hasty purchases.",
    confidence: "High"
  },
  {
    type: "exaggerated_guarantee",
    regex: /\bguaranteed results?\b|\bnever fails\b/i,
    severity: "high",
    reason: "Absolute outcomes are rarely defensible and often misleading.",
    confidence: "High"
  },
  {
    type: "deep_discount_pressure",
    regex: /\bfrom \d+.* to \d+/i,
    severity: "medium",
    reason: "Large anchored discounts can be manipulative without pricing evidence.",
    confidence: "Medium"
  },
  {
    type: "unverifiable_authenticity",
    regex: /\bofficial brand item\b|\b100%\s*original\b|\bno need to ask for proof\b/i,
    severity: "high",
    reason: "Authenticity claim appears without direct verifiable proof.",
    confidence: "High"
  },
  {
    type: "pressure_tactic",
    regex: /\bclick now\b|\bbuy now\b|\bregret\b|\bmiss this\b/i,
    severity: "medium",
    reason: "Buyer is being rushed rather than informed.",
    confidence: "Medium"
  },
  {
    type: "emotional_manipulation",
    regex: /\byour family\b|\beveryone else already checked out\b/i,
    severity: "medium",
    reason: "Emotional trigger language appears repeatedly.",
    confidence: "Low"
  }
];

export function mapClaimToEvidenceType(type: ClaimType): ClaimType {
  return type;
}
