import {
  ClaimResult,
  RewriteSellerPitchResponse,
  RiskFlagResult,
  SessionSummary
} from "@truststream/shared";
import {
  calculateTrustScore,
  classifyRiskFlags,
  detectClaims,
  generateBuyerQuestions,
  matchEvidence,
  rewriteSellerPitch,
  updateSessionSummary
} from "./engine";
import {
  maybeAnalyzeChunkWithLLM,
  maybeGenerateLLMSummary,
  maybeRewriteWithLLM,
  maybeTranscribeAudioChunk
} from "./provider";
import { AnalysisContext, ChunkAnalysisResult } from "./types";

export * from "./types";
export {
  detectClaims,
  classifyRiskFlags,
  matchEvidence,
  generateBuyerQuestions,
  calculateTrustScore,
  updateSessionSummary,
  rewriteSellerPitch
};

export async function analyzeTranscriptChunk(params: {
  transcriptChunk: string;
  context: AnalysisContext;
  existingSummary?: SessionSummary;
}): Promise<ChunkAnalysisResult> {
  const deterministicClaimsRaw = detectClaims(params.transcriptChunk, params.context);
  const deterministicClaims: ClaimResult[] = matchEvidence(
    deterministicClaimsRaw,
    params.context.visiblePageData,
    params.context.sellerSignals
  );
  const deterministicRisks: RiskFlagResult[] = classifyRiskFlags(params.transcriptChunk, params.context);

  const llmInsights = await maybeAnalyzeChunkWithLLM({
    transcriptChunk: params.transcriptChunk,
    sensitivity: params.context.sensitivity
  });

  const llmClaims: ClaimResult[] =
    llmInsights?.claims.map((claim, index) => ({
      id: `${params.context.chunkId}-llm-claim-${index + 1}`,
      chunkId: params.context.chunkId,
      claimText: claim.claimText,
      claimCategory: claim.claimCategory,
      confidence: claim.confidence,
      evidenceStatus: "evidence_unclear",
      reasoning: claim.reasoning,
      recommendedQuestion: claim.recommendedQuestion
    })) ?? [];

  const llmRisks: RiskFlagResult[] =
    llmInsights?.risks.map((risk, index) => ({
      id: `${params.context.chunkId}-llm-risk-${index + 1}`,
      chunkId: params.context.chunkId,
      riskType: risk.riskType,
      severity: risk.severity,
      confidence: risk.confidence,
      triggerText: risk.triggerText,
      reasoning: risk.reasoning
    })) ?? [];

  const dedupedClaimsMap = new Map<string, ClaimResult>();
  [...deterministicClaims, ...llmClaims].forEach((claim) => {
    const key = `${claim.claimCategory}:${claim.claimText.toLowerCase()}`;
    if (!dedupedClaimsMap.has(key)) dedupedClaimsMap.set(key, claim);
  });
  const claims = Array.from(dedupedClaimsMap.values()).slice(0, 16);

  const dedupedRisksMap = new Map<string, RiskFlagResult>();
  [...deterministicRisks, ...llmRisks].forEach((risk) => {
    const key = `${risk.riskType}:${risk.triggerText.toLowerCase()}`;
    if (!dedupedRisksMap.has(key)) dedupedRisksMap.set(key, risk);
  });
  const riskFlags = Array.from(dedupedRisksMap.values()).slice(0, 16);

  const suggestedQuestions = generateBuyerQuestions(claims, riskFlags);
  const trustScore = calculateTrustScore(
    claims,
    riskFlags,
    params.context.sellerSignals,
    params.context.transcriptWindow.length,
    params.context.transcriptWindow.join(" ")
  );

  let summary = updateSessionSummary(params.existingSummary, {
    claims,
    riskFlags,
    suggestedQuestions,
    trustScore
  });
  const llmSummary = await maybeGenerateLLMSummary({
    transcriptChunk: params.transcriptChunk,
    latestScore: trustScore.score
  });
  if (llmSummary) {
    summary = llmSummary;
  }

  return {
    claims,
    riskFlags,
    suggestedQuestions,
    trustScore,
    summary
  };
}

export async function rewriteSellerPitchEnhanced(text: string): Promise<RewriteSellerPitchResponse> {
  const deterministic = rewriteSellerPitch(text);
  const llmRewrite = await maybeRewriteWithLLM(text);

  return {
    rewrittenPitch: llmRewrite ?? deterministic.rewrittenPitch,
    changes: deterministic.changes,
    trustImprovementScore: deterministic.trustImprovementScore
  };
}

export async function transcribeAudioChunk(input: {
  audioBuffer: Uint8Array;
  mimeType: string;
}): Promise<string | null> {
  return maybeTranscribeAudioChunk(input);
}
