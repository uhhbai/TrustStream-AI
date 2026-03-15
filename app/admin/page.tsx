import { AlertOctagon, ShieldAlert, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { aseanRiskOverview, flaggedStreams, livestreamSessions, topScamPatterns } from "@/data/mockData";
import { analyzeSession } from "@/services/analyzeSession";

function riskTone(level: "Low" | "Moderate" | "High") {
  if (level === "Low") return "success" as const;
  if (level === "Moderate") return "warning" as const;
  return "danger" as const;
}

export default function AdminPage() {
  const sessionRiskRows = flaggedStreams.map((stream) => {
    const score = analyzeSession(stream.sessionId).trustScore.score;
    return { ...stream, score };
  });

  const totalFlags = sessionRiskRows.reduce((sum, row) => sum + row.flaggedCount, 0);
  const activeSessions = livestreamSessions.length;
  const highRiskCount = sessionRiskRows.filter((row) => row.riskLevel === "High").length;

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-bold text-ink">Admin / Safety View</h1>
        <p className="mt-1 text-sm text-slate-600">
          Monitor flagged streams, recurring scam patterns, and ASEAN country-level placeholder risk trends.
        </p>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-navy text-white">
          <p className="text-xs uppercase tracking-wide text-slate-200">Active monitored streams</p>
          <p className="mt-2 text-3xl font-bold">{activeSessions}</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-wide text-slate-500">Total risk events</p>
          <p className="mt-2 text-3xl font-bold text-danger">{totalFlags}</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-wide text-slate-500">High-risk streams</p>
          <p className="mt-2 text-3xl font-bold text-caution">{highRiskCount}</p>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <div className="mb-4 flex items-center gap-2">
            <ShieldAlert size={16} className="text-danger" />
            <h2 className="text-sm font-semibold text-ink">Flagged Streams</h2>
          </div>
          <div className="space-y-2">
            {sessionRiskRows.map((stream) => (
              <div key={stream.sessionId} className="rounded-xl border border-border bg-slate-50 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-800">{stream.title}</p>
                  <Badge tone={riskTone(stream.riskLevel)}>{stream.riskLevel}</Badge>
                </div>
                <p className="mt-1 text-xs text-slate-500">{stream.country}</p>
                <p className="mt-2 text-xs text-slate-600">Top pattern: {stream.topPattern}</p>
                <p className="mt-1 text-xs text-slate-600">
                  Flag count: {stream.flaggedCount} • Trust score: {stream.score}/100
                </p>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div className="mb-4 flex items-center gap-2">
            <AlertOctagon size={16} className="text-caution" />
            <h2 className="text-sm font-semibold text-ink">Top Repeated Scam Patterns</h2>
          </div>
          <div className="space-y-3">
            {topScamPatterns.map((pattern) => (
              <div key={pattern.pattern}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="text-slate-600">{pattern.pattern}</span>
                  <span className="font-semibold text-slate-700">{pattern.count}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100">
                  <div
                    className="h-2 rounded-full bg-amber-400"
                    style={{ width: `${Math.min(100, pattern.count)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <div className="mb-4 flex items-center gap-2">
          <TrendingUp size={16} className="text-blue-700" />
          <h2 className="text-sm font-semibold text-ink">ASEAN Scam Risk Overview (Mock Heatmap)</h2>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {aseanRiskOverview.map((row) => (
            <div key={row.country} className="rounded-xl border border-border bg-white p-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-800">{row.country}</p>
                <Badge tone={row.index > 65 ? "danger" : row.index > 45 ? "warning" : "success"}>
                  Risk {row.index}
                </Badge>
              </div>
              <div className="mt-3 h-2 rounded-full bg-slate-100">
                <div
                  className={`h-2 rounded-full ${
                    row.index > 65 ? "bg-danger" : row.index > 45 ? "bg-caution" : "bg-trust"
                  }`}
                  style={{ width: `${row.index}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-slate-500">Trend: {row.trend}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
