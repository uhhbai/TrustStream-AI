"use client";

import { Card } from "@/components/ui/card";
import { TranscriptLine } from "@/types";

interface LiveTranscriptProps {
  lines: TranscriptLine[];
  isPlaying: boolean;
}

export function LiveTranscript({ lines, isPlaying }: LiveTranscriptProps) {
  return (
    <Card className="h-full min-h-[320px]">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-ink">Live Transcript Feed</h3>
        <span className="text-xs text-slate-500">{isPlaying ? "Live updating..." : "Paused"}</span>
      </div>

      {lines.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-5 text-sm text-slate-500">
          No transcript lines yet. Start the stream simulation to see real-time claim detection.
        </div>
      ) : (
        <div className="max-h-[360px] space-y-2 overflow-auto pr-2">
          {lines.map((line) => (
            <div key={line.id} className="rounded-xl border border-border/80 bg-slate-50 p-3">
              <p className="text-xs text-slate-400">{line.timestamp}</p>
              <p className="mt-1 text-sm text-slate-700">{line.text}</p>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
