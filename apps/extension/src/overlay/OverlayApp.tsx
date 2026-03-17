import React, { useMemo, useState } from "react";
import { SessionStateResponse } from "@truststream/shared";

interface OverlayProps {
  sessionId: string;
  platform: string;
  diagnosticsMode: "dom" | "limited_visibility";
  state: SessionStateResponse | null;
  audioCapture?: {
    enabled: boolean;
    streamId?: string;
    reason?: string;
  };
  onSendManualChunk: (text: string) => void;
  onStop: () => void;
}

export function OverlayApp({
  sessionId,
  platform,
  diagnosticsMode,
  state,
  audioCapture,
  onSendManualChunk,
  onStop
}: OverlayProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [manualInput, setManualInput] = useState("");

  const limitedMode = diagnosticsMode === "limited_visibility";
  const labelClass = useMemo(() => state?.trustScore.label ?? "caution", [state?.trustScore.label]);

  const sendManual = () => {
    if (!manualInput.trim()) return;
    onSendManualChunk(manualInput.trim());
    setManualInput("");
  };

  return (
    <div className="panel">
      <div className="header" data-drag-handle>
        <div>
          <div className="title">TrustStream AI</div>
          <div className="small">
            {platform} | {state?.status ?? "listening"}
          </div>
          <div className="small">Extraction mode: {diagnosticsMode}</div>
        </div>
        <div className="row">
          <button className="btn btnGhost" onClick={() => setCollapsed((prev) => !prev)}>
            {collapsed ? "Expand" : "Compact"}
          </button>
          <button className="btn btnGhost" onClick={onStop}>
            Stop
          </button>
        </div>
      </div>

      {!collapsed && (
        <div className="content">
          <div className="card">
            <div className="row">
              <div>
                <div className="small">Trust score</div>
                <div className="score">{state?.trustScore.score ?? "--"}</div>
              </div>
              <span className={`badge ${labelClass}`}>{state?.trustScore.label ?? "waiting"}</span>
            </div>
            <div className="small">Confidence: {state?.trustScore.confidence ?? "Waiting"}</div>
          </div>

          {limitedMode && (
            <div className="card">
              <div className="small">
                Limited visibility mode: captions were not reliably detected. Paste transcript lines manually for live
                analysis.
              </div>
              <textarea
                className="textArea"
                value={manualInput}
                onChange={(event) => setManualInput(event.target.value)}
                placeholder="Paste transcript or seller claim text here..."
              />
              <button className="btn btnPrimary" onClick={sendManual}>
                Analyze text
              </button>
            </div>
          )}

          <div className="card">
            <div className="small">Live transcript feed</div>
            <div className="list">
              {(state?.transcriptFeed ?? [])
                .slice(-8)
                .reverse()
                .map((line) => (
                  <div key={line.chunkId} className="item">
                    <div>{line.text}</div>
                    <div className="small">
                      {line.source} | {new Date(line.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              {(state?.transcriptFeed ?? []).length === 0 && (
                <div className="small">
                  Waiting for transcript chunks... If this stays empty, refresh the stream tab and start analysis again.
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="small">Live claims</div>
            <div className="list">
              {(state?.claims ?? []).slice(0, 4).map((claim) => (
                <div key={claim.id} className="item">
                  <div>{claim.claimText}</div>
                  <div className="small">
                    {claim.claimCategory} | {claim.evidenceStatus} | {claim.confidence}
                  </div>
                  <div className="small">Why flagged: {claim.reasoning}</div>
                  <div className="small">Ask seller: {claim.recommendedQuestion}</div>
                </div>
              ))}
              {(state?.claims ?? []).length === 0 && <div className="small">No claims detected yet.</div>}
            </div>
          </div>

          <div className="card">
            <div className="small">Risk flags</div>
            <div className="list">
              {(state?.riskFlags ?? []).slice(0, 4).map((risk) => (
                <div key={risk.id} className="item">
                  <div>{risk.riskType}</div>
                  <div className="small">
                    {risk.severity} | {risk.confidence}
                  </div>
                  <div className="small">Trigger: {risk.triggerText}</div>
                  <div className="small">Why it may be fake/risky: {risk.reasoning}</div>
                </div>
              ))}
              {(state?.riskFlags ?? []).length === 0 && <div className="small">No risk spikes yet.</div>}
            </div>
          </div>

          <div className="card">
            <div className="small">Buyer questions</div>
            <div className="list">
              {(state?.suggestedQuestions ?? []).slice(0, 3).map((question) => (
                <div key={question} className="item">
                  {question}
                </div>
              ))}
              {(state?.suggestedQuestions ?? []).length === 0 && (
                <div className="small">Questions will appear when unresolved claims are detected.</div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="small">Rolling summary</div>
            <div className="item">{state?.summary.rollingSummary ?? "Waiting for first transcript chunks..."}</div>
            <div className="small">Updated: {state?.updatedAt ?? "-"}</div>
            <div className="small">Session: {sessionId.slice(0, 8)}...</div>
            <div className="small">
              Audio capture: {audioCapture?.enabled ? "enabled" : `not active${audioCapture?.reason ? ` (${audioCapture.reason})` : ""}`}
            </div>
          </div>

          <div className="card">
            <div className="small">Score explanation</div>
            <div className="item">
              <div className="small">Positive signals</div>
              <ul>
                {(state?.trustScore.explanation.positiveSignals ?? []).slice(0, 3).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div className="item">
              <div className="small">Negative signals</div>
              <ul>
                {(state?.trustScore.explanation.negativeSignals ?? []).slice(0, 4).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>

          {!limitedMode && (
            <div className="card">
              <div className="small">Manual strict transcript input (optional)</div>
              <textarea
                className="textArea"
                value={manualInput}
                onChange={(event) => setManualInput(event.target.value)}
                placeholder="Paste exact spoken line to force analysis..."
              />
              <button className="btn btnPrimary" onClick={sendManual}>
                Analyze pasted transcript
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
