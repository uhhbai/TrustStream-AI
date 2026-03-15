export type PlatformName = "tiktok" | "instagram" | "shopee" | "generic";

export type SessionStatus = "idle" | "listening" | "analyzing" | "stopped" | "error";

export type ClaimCategory =
  | "authenticity"
  | "certification"
  | "urgency"
  | "returns"
  | "results"
  | "price"
  | "stock";

export type EvidenceStatus = "shown" | "evidence_unclear" | "not_verified";

export type RiskType =
  | "fake_urgency"
  | "exaggerated_guarantee"
  | "suspicious_discount"
  | "unverifiable_authenticity"
  | "pressure_tactic"
  | "contradictory_statement";

export type RiskSeverity = "low" | "medium" | "high";
export type ConfidenceLabel = "High" | "Medium" | "Low";

export interface ClaimResult {
  id: string;
  chunkId: string;
  claimText: string;
  claimCategory: ClaimCategory;
  confidence: ConfidenceLabel;
  evidenceStatus: EvidenceStatus;
  reasoning: string;
  recommendedQuestion: string;
}

export interface RiskFlagResult {
  id: string;
  chunkId: string;
  riskType: RiskType;
  severity: RiskSeverity;
  confidence: ConfidenceLabel;
  triggerText: string;
  reasoning: string;
}

export interface TrustScoreBreakdown {
  score: number;
  label: "trusted" | "caution" | "high_risk";
  confidence: ConfidenceLabel;
  explanation: {
    positiveSignals: string[];
    negativeSignals: string[];
    weightedFactors: Record<string, number>;
  };
}

export interface SessionSummary {
  rollingSummary: string;
  buyerGuidance: string[];
  keyChanges: string[];
}

export interface TranscriptFeedItem {
  chunkId: string;
  text: string;
  source: "dom_caption" | "dom_product" | "manual" | "audio_stt";
  timestamp: string;
}

export interface ChunkIngestRequest {
  text: string;
  source: "dom_caption" | "dom_product" | "manual" | "audio_stt";
  timestamp?: string;
  visiblePageData?: {
    productName?: string;
    listedPrice?: string;
    sellerLabel?: string;
    extraText?: string[];
  };
}

export interface SessionStartRequest {
  platform: PlatformName;
  pageUrl: string;
  tabId?: number;
  title?: string;
  language?: string;
  sensitivity?: "conservative" | "balanced" | "strict";
}

export interface SessionStartResponse {
  sessionId: string;
  status: SessionStatus;
  platform: PlatformName;
  startedAt: string;
}

export interface SessionStateResponse {
  sessionId: string;
  status: SessionStatus;
  platform: PlatformName;
  pageUrl: string;
  updatedAt: string;
  trustScore: TrustScoreBreakdown;
  claims: ClaimResult[];
  riskFlags: RiskFlagResult[];
  suggestedQuestions: string[];
  summary: SessionSummary;
  chunkCount: number;
  transcriptFeed: TranscriptFeedItem[];
}

export interface AnalyzeTextRequest {
  text: string;
  context?: {
    language?: string;
    sensitivity?: "conservative" | "balanced" | "strict";
  };
}

export interface RewriteSellerPitchRequest {
  text: string;
}

export interface RewriteSellerPitchResponse {
  rewrittenPitch: string;
  changes: string[];
  trustImprovementScore: number;
}

export interface SessionHistoryItem {
  sessionId: string;
  platform: PlatformName;
  pageUrl: string;
  startedAt: string;
  endedAt?: string;
  latestScore: number;
  latestLabel: "trusted" | "caution" | "high_risk";
}

export interface SessionEventPayload {
  event: "session_started" | "chunk_processed" | "session_stopped" | "session_error";
  state: SessionStateResponse;
}

export interface AdapterDiagnostics {
  platform: PlatformName;
  captionSelectorsChecked: string[];
  extractionMode: "dom" | "limited_visibility";
  lastExtractionCount: number;
}
