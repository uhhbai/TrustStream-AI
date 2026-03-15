export type ClaimType =
  | "authenticity"
  | "certification"
  | "urgency"
  | "returns"
  | "results"
  | "stock"
  | "price";

export type EvidenceStatus = "shown" | "not_shown" | "cannot_verify";
export type RiskSeverity = "low" | "medium" | "high";
export type RiskType =
  | "fake_urgency"
  | "exaggerated_guarantee"
  | "deep_discount_pressure"
  | "unverifiable_authenticity"
  | "refund_policy_conflict"
  | "pressure_tactic"
  | "emotional_manipulation";

export interface TranscriptLine {
  id: string;
  timestamp: string;
  text: string;
}

export interface Seller {
  id: string;
  name: string;
  region: string;
  rating: number;
  verified: boolean;
  pastViolations: number;
}

export interface ProductEvidence {
  id: string;
  type: ClaimType | "invoice" | "demo";
  title: string;
  available: boolean;
  detail: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  currency: string;
  evidence: ProductEvidence[];
}

export interface LivestreamSession {
  id: string;
  title: string;
  country: string;
  scenario: "trustworthy" | "mixed" | "high_risk";
  sellerId: string;
  productId: string;
  transcript: TranscriptLine[];
  viewerCount: number;
}

export interface ClaimMatch {
  id: string;
  sessionId: string;
  lineId: string;
  claimText: string;
  claimType: ClaimType;
  confidence: "High" | "Medium" | "Low";
  matchedText?: string;
  rationale?: string;
}

export interface EvidenceMatchResult {
  claimId: string;
  evidenceStatus: EvidenceStatus;
  supportingEvidence?: ProductEvidence;
  note: string;
  matchQuality?: "strong" | "partial" | "weak";
}

export interface RiskFlag {
  id: string;
  sessionId: string;
  lineId: string;
  riskType: RiskType;
  severity: RiskSeverity;
  reason: string;
  confidence: "High" | "Medium" | "Low";
  triggerText?: string;
}

export interface TrustScoreBreakdown {
  score: number;
  transparency: number;
  claimVerifiability: number;
  sellerCredibility: number;
  riskPenalty: number;
  confidenceLabel?: "High" | "Medium" | "Low";
}

export interface StreamSummary {
  product: string;
  claimsMade: string[];
  demonstrated: string[];
  unverified: string[];
  buyerQuestions: string[];
  shortSummary: string;
}

export interface SessionAnalysis {
  claims: ClaimMatch[];
  evidenceMatches: EvidenceMatchResult[];
  riskFlags: RiskFlag[];
  trustScore: TrustScoreBreakdown;
  summary: StreamSummary;
}

export interface FlaggedStreamItem {
  sessionId: string;
  title: string;
  country: string;
  riskLevel: "Low" | "Moderate" | "High";
  topPattern: string;
  flaggedCount: number;
}

export interface CountryRisk {
  country: string;
  index: number;
  trend: "rising" | "stable" | "declining";
}
