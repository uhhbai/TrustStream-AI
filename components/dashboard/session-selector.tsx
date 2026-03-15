"use client";

import { LivestreamSession } from "@/types";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface SessionSelectorProps {
  sessions: LivestreamSession[];
  selectedSessionId: string;
  onSelect: (sessionId: string) => void;
}

function scenarioTone(scenario: LivestreamSession["scenario"]) {
  if (scenario === "trustworthy") return "success";
  if (scenario === "mixed") return "warning";
  return "danger";
}

export function SessionSelector({
  sessions,
  selectedSessionId,
  onSelect
}: SessionSelectorProps) {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      {sessions.map((session) => {
        const active = session.id === selectedSessionId;
        return (
          <button
            key={session.id}
            type="button"
            onClick={() => onSelect(session.id)}
            className={cn(
              "rounded-2xl border p-4 text-left transition-all",
              active
                ? "border-navy bg-navy text-white shadow-soft"
                : "border-border bg-white hover:border-navy/40 hover:bg-slate-50"
            )}
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-sm font-semibold">{session.title}</p>
              <Badge tone={scenarioTone(session.scenario)} className={active ? "bg-white/20 text-white" : ""}>
                {session.scenario.replace("_", " ")}
              </Badge>
            </div>
            <p className={cn("text-xs", active ? "text-slate-100" : "text-slate-500")}>
              {session.country} • {session.viewerCount.toLocaleString()} viewers
            </p>
          </button>
        );
      })}
    </div>
  );
}
