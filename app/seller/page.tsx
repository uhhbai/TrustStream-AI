"use client";

import { ChangeEvent, useMemo, useState } from "react";
import { ShieldPlus, Upload } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { analyzeSellerPitch } from "@/services/analyzeSellerPitch";

const seedPitch = `These earbuds are 100% original official brand item.
Guaranteed results and only for the next 90 seconds.
Click now now now before stock vanishes every second.
No need to ask for proof, this deal is real.`;

export default function SellerModePage() {
  const [pitch, setPitch] = useState(seedPitch);

  const feedback = useMemo(() => analyzeSellerPitch(pitch), [pitch]);

  const handleUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    setPitch(text);
  };

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-bold text-ink">Seller Mode</h1>
        <p className="mt-1 text-sm text-slate-600">
          Draft a product pitch and get AI-style guidance to improve trust and reduce risky language.
        </p>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-ink">Paste or upload transcript</h2>
            <label className="cursor-pointer">
              <input type="file" accept=".txt" className="hidden" onChange={handleUpload} />
              <span className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50">
                <Upload size={13} />
                Upload .txt
              </span>
            </label>
          </div>
          <textarea
            value={pitch}
            onChange={(event) => setPitch(event.target.value)}
            className="min-h-[260px] w-full rounded-xl border border-border p-3 text-sm text-slate-700 outline-none focus:border-navy"
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" onClick={() => setPitch(seedPitch)}>
              Load risky sample
            </Button>
            <Button variant="ghost" size="sm">
              <ShieldPlus size={14} />
              <span className="ml-1.5">Generate safer pitch</span>
            </Button>
          </div>
        </Card>

        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-ink">Trust improvement score</h2>
            <Badge tone={feedback.trustImprovementScore >= 75 ? "success" : "warning"}>
              {feedback.trustImprovementScore}/100
            </Badge>
          </div>
          <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-700">{feedback.rewrittenPitch}</p>

          <div className="mt-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Risky wording feedback</p>
            <div className="space-y-2">
              {feedback.risks.length > 0 ? (
                feedback.risks.map((risk) => (
                  <div key={risk.id} className="rounded-xl border border-rose-200 bg-rose-50 p-3">
                    <p className="text-xs font-semibold uppercase text-danger">
                      {risk.riskType.replace(/_/g, " ")} • {risk.confidence} confidence
                    </p>
                    <p className="mt-1 text-sm text-slate-700">{risk.reason}</p>
                  </div>
                ))
              ) : (
                <p className="rounded-xl border border-dashed border-border p-3 text-sm text-slate-500">
                  No critical risky wording detected.
                </p>
              )}
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h3 className="mb-3 text-sm font-semibold text-ink">Claim signals found</h3>
          <div className="space-y-2">
            {feedback.claims.length > 0 ? (
              feedback.claims.map((claim) => (
                <div key={claim.id} className="rounded-xl bg-slate-50 p-3">
                  <p className="text-xs font-semibold uppercase text-slate-500">
                    {claim.claimType} • {claim.confidence} confidence
                  </p>
                  <p className="mt-1 text-sm text-slate-700">{claim.claimText}</p>
                </div>
              ))
            ) : (
              <p className="rounded-xl border border-dashed border-border p-3 text-sm text-slate-500">
                Add a transcript to detect claims.
              </p>
            )}
          </div>
        </Card>

        <Card>
          <h3 className="mb-3 text-sm font-semibold text-ink">Suggestions to improve trust</h3>
          <div className="space-y-2">
            {feedback.recommendations.length > 0 ? (
              feedback.recommendations.map((item) => (
                <p key={item} className="rounded-xl bg-green-50 p-3 text-sm text-slate-700">
                  {item}
                </p>
              ))
            ) : (
              <p className="rounded-xl border border-dashed border-border p-3 text-sm text-slate-500">
                No changes needed. Pitch language is already evidence-friendly.
              </p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
