"use client";

import { Play, Pause, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface SimulatedPlayerProps {
  title: string;
  country: string;
  viewers: number;
  progress: number;
  isPlaying: boolean;
  speedMs: number;
  onTogglePlay: () => void;
  onReset: () => void;
  onSpeedChange: (value: number) => void;
}

export function SimulatedPlayer({
  title,
  country,
  viewers,
  progress,
  isPlaying,
  speedMs,
  onTogglePlay,
  onReset,
  onSpeedChange
}: SimulatedPlayerProps) {
  return (
    <Card className="overflow-hidden bg-navy text-white">
      <div className="mb-5 rounded-xl bg-white/10 p-4">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-200">Simulated livestream</p>
        <h2 className="mt-2 text-xl font-semibold">{title}</h2>
        <p className="mt-1 text-sm text-slate-200">
          {country} • {viewers.toLocaleString()} viewers live
        </p>
      </div>

      <div className="mb-4 h-2 rounded-full bg-white/20">
        <div className="h-2 rounded-full bg-green-300 transition-all" style={{ width: `${progress}%` }} />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button variant="secondary" onClick={onTogglePlay} size="sm">
          {isPlaying ? <Pause size={15} /> : <Play size={15} />}
          <span className="ml-1.5">{isPlaying ? "Pause" : "Start"}</span>
        </Button>
        <Button variant="ghost" onClick={onReset} size="sm" className="border-white/20 bg-white/10 text-white">
          <RotateCcw size={14} />
          <span className="ml-1.5">Reset</span>
        </Button>
        <div className="ml-auto flex items-center gap-2 text-xs text-slate-200">
          <span>Speed</span>
          <select
            value={speedMs}
            onChange={(event) => onSpeedChange(Number(event.target.value))}
            className="rounded-lg border border-white/20 bg-white/10 px-2 py-1 text-xs text-white outline-none"
          >
            <option value={1700}>Slow</option>
            <option value={1400}>Normal</option>
            <option value={900}>Fast</option>
          </select>
        </div>
      </div>
    </Card>
  );
}
