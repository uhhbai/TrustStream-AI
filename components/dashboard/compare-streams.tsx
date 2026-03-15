import { LivestreamSession, TrustScoreBreakdown } from "@/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface CompareStreamsProps {
  rows: Array<{
    session: LivestreamSession;
    score: TrustScoreBreakdown;
  }>;
}

export function CompareStreams({ rows }: CompareStreamsProps) {
  return (
    <Card>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-ink">Compare Streams</h3>
        <Badge tone="neutral">Mini feature</Badge>
      </div>

      <div className="space-y-2">
        {rows.map(({ session, score }) => (
          <div key={session.id} className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
            <div>
              <p className="text-sm font-medium text-slate-800">{session.title}</p>
              <p className="text-xs text-slate-500">{session.country}</p>
            </div>
            <p className="text-sm font-semibold text-ink">{score.score}/100</p>
          </div>
        ))}
      </div>
    </Card>
  );
}
