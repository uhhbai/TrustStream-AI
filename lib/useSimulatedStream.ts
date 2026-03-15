"use client";

import { useEffect, useMemo, useState } from "react";
import { LivestreamSession } from "@/types";

export function useSimulatedStream(session: LivestreamSession) {
  const [lineIndex, setLineIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speedMs, setSpeedMs] = useState(1400);

  useEffect(() => {
    setLineIndex(0);
    setIsPlaying(false);
  }, [session.id]);

  useEffect(() => {
    if (!isPlaying) return;
    if (lineIndex >= session.transcript.length) return;

    const timer = setTimeout(() => {
      setLineIndex((prev) => prev + 1);
    }, speedMs);

    return () => clearTimeout(timer);
  }, [isPlaying, lineIndex, session.transcript.length, speedMs]);

  const visibleLines = useMemo(
    () => session.transcript.slice(0, lineIndex),
    [session.transcript, lineIndex]
  );

  const progress = Math.round((lineIndex / session.transcript.length) * 100);

  return {
    lineIndex,
    visibleLines,
    progress,
    isPlaying,
    speedMs,
    setSpeedMs,
    setIsPlaying,
    setLineIndex,
    reset: () => {
      setLineIndex(0);
      setIsPlaying(false);
    }
  };
}
