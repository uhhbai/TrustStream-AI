"use client";

import { useEffect, useMemo, useState } from "react";
import { CompareStreams } from "@/components/dashboard/compare-streams";
import { ClaimsPanel } from "@/components/dashboard/claims-panel";
import { LiveTranscript } from "@/components/dashboard/live-transcript";
import { SessionSelector } from "@/components/dashboard/session-selector";
import { SimulatedPlayer } from "@/components/dashboard/simulated-player";
import { SummaryCard } from "@/components/dashboard/summary-card";
import { TrustCard } from "@/components/dashboard/trust-card";
import { Card } from "@/components/ui/card";
import { livestreamSessions, products, sellers } from "@/data/mockData";
import { useSimulatedStream } from "@/lib/useSimulatedStream";
import { analyzeSession } from "@/services/analyzeSession";

type LanguageMode = "english" | "asean_ready";

export default function BuyerDemoPage() {
  const [selectedSessionId, setSelectedSessionId] = useState(livestreamSessions[0].id);
  const [languageMode, setLanguageMode] = useState<LanguageMode>("english");
  const [isLoading, setIsLoading] = useState(false);

  const session = useMemo(
    () => livestreamSessions.find((item) => item.id === selectedSessionId) ?? livestreamSessions[0],
    [selectedSessionId]
  );
  const seller = useMemo(() => sellers.find((item) => item.id === session.sellerId), [session.sellerId]);
  const product = useMemo(() => products.find((item) => item.id === session.productId), [session.productId]);

  const stream = useSimulatedStream(session);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, [selectedSessionId]);

  const analysis = useMemo(
    () => analyzeSession(session.id, stream.lineIndex),
    [session.id, stream.lineIndex]
  );

  const comparisonRows = useMemo(
    () =>
      livestreamSessions.map((item) => ({
        session: item,
        score: analyzeSession(item.id).trustScore
      })),
    []
  );

  const headingCopy =
    languageMode === "english"
      ? "Buyer Demo Dashboard"
      : "Buyer Demo Dashboard (ASEAN multilingual ready placeholder)";

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">{headingCopy}</h1>
          <p className="mt-1 text-sm text-slate-600">
            Simulated real-time analysis of claims, evidence, and persuasion risks.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-border bg-white p-2">
          <button
            type="button"
            onClick={() => setLanguageMode("english")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
              languageMode === "english" ? "bg-navy text-white" : "text-slate-600"
            }`}
          >
            English
          </button>
          <button
            type="button"
            onClick={() => setLanguageMode("asean_ready")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
              languageMode === "asean_ready" ? "bg-navy text-white" : "text-slate-600"
            }`}
          >
            ASEAN Ready
          </button>
        </div>
      </section>

      <SessionSelector
        sessions={livestreamSessions}
        selectedSessionId={selectedSessionId}
        onSelect={setSelectedSessionId}
      />

      {isLoading ? (
        <Card className="p-10 text-center text-sm text-slate-500">Loading stream simulation and trust signals...</Card>
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <SimulatedPlayer
                title={session.title}
                country={session.country}
                viewers={session.viewerCount}
                progress={stream.progress}
                isPlaying={stream.isPlaying}
                speedMs={stream.speedMs}
                onTogglePlay={() => stream.setIsPlaying(!stream.isPlaying)}
                onReset={stream.reset}
                onSpeedChange={stream.setSpeedMs}
              />
            </div>
            <Card>
              <h2 className="text-sm font-semibold text-ink">Context</h2>
              <p className="mt-3 text-xs uppercase tracking-wide text-slate-500">Seller</p>
              <p className="mt-1 text-sm text-slate-700">
                {seller?.name} ({seller?.region})
              </p>
              <p className="mt-2 text-xs text-slate-500">
                Rating {seller?.rating} • {seller?.verified ? "Verified seller" : "Unverified seller"}
              </p>
              <p className="mt-4 text-xs uppercase tracking-wide text-slate-500">Product</p>
              <p className="mt-1 text-sm text-slate-700">{product?.name}</p>
              <p className="mt-2 text-xs text-slate-500">
                {product?.currency} {product?.price} • {product?.category}
              </p>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <LiveTranscript lines={stream.visibleLines} isPlaying={stream.isPlaying} />
            <ClaimsPanel claims={analysis.claims} evidenceMatches={analysis.evidenceMatches} />
            <TrustCard
              trustScore={analysis.trustScore}
              evidenceMatches={analysis.evidenceMatches}
              riskFlags={analysis.riskFlags}
              recommendedQuestions={analysis.summary.buyerQuestions}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <SummaryCard summary={analysis.summary} />
            <CompareStreams rows={comparisonRows} />
          </div>
        </>
      )}
    </div>
  );
}
