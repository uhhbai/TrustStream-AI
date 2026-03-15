import {
  ClaimResult,
  RiskFlagResult,
  SessionSummary,
  TrustScoreBreakdown
} from "@truststream/shared";

export interface AnalysisContext {
  sessionId: string;
  chunkId: string;
  transcriptWindow: string[];
  visiblePageData?: {
    productName?: string;
    listedPrice?: string;
    sellerLabel?: string;
    extraText?: string[];
  };
  sellerSignals?: {
    verified?: boolean;
    historyRiskCount?: number;
  };
  sensitivity?: "conservative" | "balanced" | "strict";
}

export interface ChunkAnalysisResult {
  claims: ClaimResult[];
  riskFlags: RiskFlagResult[];
  suggestedQuestions: string[];
  trustScore: TrustScoreBreakdown;
  summary: SessionSummary;
}
