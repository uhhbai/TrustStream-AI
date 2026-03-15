"use client";

import { AlertTriangle, CheckCircle2, CircleHelp, ShieldAlert } from "lucide-react";
import { EvidenceMatchResult, RiskFlag, TrustScoreBreakdown } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface TrustCardProps {
  trustScore: TrustScoreBreakdown;
  evidenceMatches: EvidenceMatchResult[];
  riskFlags: RiskFlag[];
  recommendedQuestions: string[];
}

function trustLabel(score: number) {
  if (score >= 75) return { text: "High trust", tone: "success" as const };
  if (score >= 50) return { text: "Medium trust", tone: "warning" as const };
  return { text: "High risk", tone: "danger" as const };
}

export function TrustCard({
  trustScore,
  evidenceMatches,
  riskFlags,
  recommendedQuestions
}: TrustCardProps) {
  const verified = evidenceMatches.filter((item) => item.evidenceStatus === "shown").length;
  const unverified = evidenceMatches.filter((item) => item.evidenceStatus !== "shown").length;
  const label = trustLabel(trustScore.score);

  return (
    <Card className="h-full">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-ink">Trust Card</h3>
        <Badge tone={label.tone}>{label.text}</Badge>
      </div>

      <div className="mb-5 rounded-2xl bg-slate-50 p-4">
        <p className="text-xs uppercase tracking-wide text-slate-500">Overall trust score</p>
        <p className="mt-1 text-3xl font-bold text-ink">{trustScore.score}/100</p>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-xl border border-green-200 bg-green-50 p-3">
          <p className="font-semibold text-trust">Verified claims</p>
          <p className="mt-1 text-lg font-semibold text-trust">{verified}</p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
          <p className="font-semibold text-caution">Unverified claims</p>
          <p className="mt-1 text-lg font-semibold text-caution">{unverified}</p>
        </div>
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3">
          <p className="font-semibold text-danger">Risk flags</p>
          <p className="mt-1 text-lg font-semibold text-danger">{riskFlags.length}</p>
        </div>
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-3">
          <p className="font-semibold text-blue-700">Transparency</p>
          <p className="mt-1 text-lg font-semibold text-blue-700">{trustScore.transparency}</p>
        </div>
      </div>

      <div className="mt-5 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Top risk flags</p>
        {riskFlags.length > 0 ? (
          riskFlags.slice(0, 3).map((flag) => (
            <div
              key={flag.id}
              className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-slate-700"
            >
              <ShieldAlert className="mt-0.5 text-danger" size={14} />
              <span>
                {flag.riskType.replace(/_/g, " ")} ({flag.confidence})
              </span>
            </div>
          ))
        ) : (
          <p className="rounded-xl border border-dashed border-border p-3 text-xs text-slate-500">
            No significant risk flags detected so far.
          </p>
        )}
      </div>

      <div className="mt-4 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Recommended buyer questions
        </p>
        {recommendedQuestions.slice(0, 3).map((q) => (
          <div key={q} className="flex items-start gap-2 rounded-xl bg-slate-50 p-3 text-xs text-slate-700">
            <CircleHelp className="mt-0.5 text-slate-400" size={14} />
            <span>{q}</span>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="ghost" size="sm">
          <AlertTriangle size={14} />
          <span className="ml-1.5">Questions to ask seller</span>
        </Button>
        <Button variant="ghost" size="sm">
          <CheckCircle2 size={14} />
          <span className="ml-1.5">Export summary PDF</span>
        </Button>
        <Button variant="ghost" size="sm">
          <ShieldAlert size={14} />
          <span className="ml-1.5">Compare streams</span>
        </Button>
      </div>
    </Card>
  );
}
