"use client";

import { StreamSummary } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

interface SummaryCardProps {
  summary: StreamSummary;
}

export function SummaryCard({ summary }: SummaryCardProps) {
  return (
    <Card>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-ink">1-Minute AI Summary</h3>
        <Badge tone="info">Late Viewer Assist</Badge>
      </div>

      <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-700">{summary.shortSummary}</p>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Demonstrated</p>
          <ul className="space-y-1 text-sm text-slate-700">
            {summary.demonstrated.length > 0 ? (
              summary.demonstrated.map((item) => <li key={item}>• {item}</li>)
            ) : (
              <li className="text-slate-500">• No demonstrated proof captured yet.</li>
            )}
          </ul>
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Still unverified</p>
          <ul className="space-y-1 text-sm text-slate-700">
            {summary.unverified.length > 0 ? (
              summary.unverified.map((item) => <li key={item}>• {item}</li>)
            ) : (
              <li className="text-slate-500">• All major claims are currently backed by evidence.</li>
            )}
          </ul>
        </div>
      </div>
    </Card>
  );
}
