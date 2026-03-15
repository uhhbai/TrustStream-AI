"use client";

import { ClaimMatch, EvidenceMatchResult } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

interface ClaimsPanelProps {
  claims: ClaimMatch[];
  evidenceMatches: EvidenceMatchResult[];
}

function evidenceTone(status: EvidenceMatchResult["evidenceStatus"]) {
  if (status === "shown") return "success";
  if (status === "not_shown") return "warning";
  return "neutral";
}

export function ClaimsPanel({ claims, evidenceMatches }: ClaimsPanelProps) {
  return (
    <Card className="h-full min-h-[320px]">
      <h3 className="mb-4 text-sm font-semibold text-ink">AI-Detected Claims</h3>
      {claims.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-4 text-sm text-slate-500">
          Claims will appear as the transcript streams in.
        </p>
      ) : (
        <div className="max-h-[360px] space-y-3 overflow-auto pr-2">
          {claims.map((claim) => {
            const evidence = evidenceMatches.find((match) => match.claimId === claim.id);
            return (
              <article key={claim.id} className="rounded-xl border border-border/80 bg-slate-50 p-3">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <Badge tone="info">{claim.claimType}</Badge>
                  <Badge tone="neutral">{claim.confidence} confidence</Badge>
                  {evidence && (
                    <Badge tone={evidenceTone(evidence.evidenceStatus)}>
                      {evidence.evidenceStatus.replace("_", " ")}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-slate-700">{claim.claimText}</p>
              </article>
            );
          })}
        </div>
      )}
    </Card>
  );
}
