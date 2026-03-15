import OpenAI from "openai";
import { ClaimCategory, ConfidenceLabel, RiskSeverity, RiskType, SessionSummary } from "@truststream/shared";

const MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

function getClient() {
  if (!process.env.OPENAI_API_KEY) return null;
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export async function maybeGenerateLLMSummary(input: {
  transcriptChunk: string;
  latestScore: number;
}): Promise<SessionSummary | null> {
  const client = getClient();
  if (!client) return null;

  try {
    const completion = await client.chat.completions.create({
      model: MODEL,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are TrustStream AI. Produce concise JSON with keys rollingSummary, buyerGuidance(array), keyChanges(array)."
        },
        {
          role: "user",
          content: `Chunk: ${input.transcriptChunk}\nLatest score: ${input.latestScore}`
        }
      ]
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) return null;
    const parsed = JSON.parse(content) as SessionSummary;
    if (!parsed.rollingSummary) return null;
    return {
      rollingSummary: parsed.rollingSummary,
      buyerGuidance: parsed.buyerGuidance ?? [],
      keyChanges: parsed.keyChanges ?? []
    };
  } catch {
    return null;
  }
}

export async function maybeAnalyzeChunkWithLLM(input: {
  transcriptChunk: string;
  sensitivity?: "conservative" | "balanced" | "strict";
}): Promise<
  | {
      claims: Array<{
        claimText: string;
        claimCategory: ClaimCategory;
        confidence: ConfidenceLabel;
        reasoning: string;
        recommendedQuestion: string;
      }>;
      risks: Array<{
        riskType: RiskType;
        severity: RiskSeverity;
        confidence: ConfidenceLabel;
        triggerText: string;
        reasoning: string;
      }>;
    }
  | null
> {
  const client = getClient();
  if (!client) return null;

  try {
    const completion = await client.chat.completions.create({
      model: MODEL,
      temperature: 0.1,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are TrustStream AI analyzer for livestream commerce. Return JSON with keys claims and risks. claims[] fields: claimText, claimCategory(authenticity|certification|urgency|returns|results|price|stock), confidence(High|Medium|Low), reasoning, recommendedQuestion. risks[] fields: riskType(fake_urgency|exaggerated_guarantee|suspicious_discount|unverifiable_authenticity|pressure_tactic|contradictory_statement), severity(low|medium|high), confidence(High|Medium|Low), triggerText, reasoning. Use empty arrays if none."
        },
        {
          role: "user",
          content: `Sensitivity: ${input.sensitivity ?? "balanced"}\nTranscript chunk:\n${input.transcriptChunk}`
        }
      ]
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) return null;
    const parsed = JSON.parse(content) as {
      claims?: Array<{
        claimText: string;
        claimCategory: ClaimCategory;
        confidence: ConfidenceLabel;
        reasoning: string;
        recommendedQuestion: string;
      }>;
      risks?: Array<{
        riskType: RiskType;
        severity: RiskSeverity;
        confidence: ConfidenceLabel;
        triggerText: string;
        reasoning: string;
      }>;
    };

    return {
      claims: parsed.claims ?? [],
      risks: parsed.risks ?? []
    };
  } catch {
    return null;
  }
}

export async function maybeRewriteWithLLM(text: string): Promise<string | null> {
  const client = getClient();
  if (!client) return null;

  try {
    const completion = await client.chat.completions.create({
      model: MODEL,
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content:
            "Rewrite seller livestream pitch to be truthful, evidence-seeking, and non-manipulative. Keep concise."
        },
        { role: "user", content: text }
      ]
    });

    return completion.choices[0]?.message?.content ?? null;
  } catch {
    return null;
  }
}

export async function maybeTranscribeAudioChunk(input: {
  audioBuffer: Uint8Array;
  mimeType: string;
}): Promise<string | null> {
  const client = getClient();
  if (!client) return null;

  try {
    const model = process.env.OPENAI_TRANSCRIBE_MODEL ?? "gpt-4o-mini-transcribe";
    const file = new File([input.audioBuffer], "stream-audio.webm", {
      type: input.mimeType || "audio/webm"
    });

    const result = await client.audio.transcriptions.create({
      file,
      model
    });

    const text = (result as { text?: string }).text?.trim();
    return text && text.length > 0 ? text : null;
  } catch {
    return null;
  }
}
