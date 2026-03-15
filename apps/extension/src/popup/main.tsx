import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { detectPlatform } from "../lib/platform";
import { SessionHistoryItem } from "@truststream/shared";
import { TrustStreamMessage } from "../lib/messages";
import "./styles.css";

type Status = "idle" | "listening" | "analyzing" | "stopped" | "error";

function statusClass(status: Status) {
  if (status === "listening") return "pill pillListening";
  if (status === "analyzing") return "pill pillAnalyzing";
  if (status === "error") return "pill pillError";
  return "pill pillIdle";
}

function PopupApp() {
  const [tabUrl, setTabUrl] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [history, setHistory] = useState<SessionHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const platform = useMemo(() => detectPlatform(tabUrl || "about:blank"), [tabUrl]);

  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      setTabUrl(tabs[0]?.url ?? "");
      chrome.runtime.sendMessage({ type: "REQUEST_STATUS" } satisfies TrustStreamMessage, (res) => {
        if (res?.status) {
          setStatus(res.status);
          setSessionId(res.sessionId ?? null);
        }
      });
    });
  }, []);

  const start = () => {
    setLoading(true);
    setNotice(null);
    chrome.runtime.sendMessage({ type: "START_ANALYSIS" } satisfies TrustStreamMessage, (res) => {
      setLoading(false);
      if (res?.ok) {
        setStatus("listening");
        setSessionId(res.sessionId ?? null);
        if (res.warning) setNotice(res.warning);
      } else {
        setStatus("error");
        if (res?.error) setNotice(res.error);
      }
    });
  };

  const stop = () => {
    setLoading(true);
    chrome.runtime.sendMessage({ type: "STOP_ANALYSIS" } satisfies TrustStreamMessage, (res) => {
      setLoading(false);
      if (res?.ok) {
        setStatus("stopped");
      }
    });
  };

  const loadHistory = () => {
    chrome.runtime.sendMessage({ type: "GET_HISTORY" } satisfies TrustStreamMessage, (res) => {
      if (Array.isArray(res)) {
        setHistory(res);
      }
    });
  };

  return (
    <div className="container">
      <div className="card">
        <div className="title">TrustStream AI</div>
        <p className="subtitle">Analysis starts only after you press Start.</p>
      </div>

      <div className="card">
        <div className="row">
          <span className="subtitle">Current platform</span>
          <span>{platform}</span>
        </div>
        <div className="row" style={{ marginTop: 6 }}>
          <span className="subtitle">Status</span>
          <span className={statusClass(status)}>{status}</span>
        </div>
        {sessionId && <p className="subtitle">Session: {sessionId.slice(0, 8)}...</p>}
      </div>

      <div className="row" style={{ marginBottom: 10 }}>
        <button className="btn btnPrimary" disabled={loading} onClick={start}>
          Start Analysis
        </button>
        <button className="btn btnGhost" disabled={loading} onClick={stop}>
          Stop
        </button>
      </div>

      <div className="row" style={{ marginBottom: 10 }}>
        <button className="btn btnGhost" onClick={() => chrome.runtime.openOptionsPage()}>
          Open Settings
        </button>
        <button className="btn btnGhost" onClick={loadHistory}>
          Session History
        </button>
      </div>

      {notice && (
        <div className="card">
          <div className="subtitle" style={{ color: "#b45309" }}>
            {notice}
          </div>
        </div>
      )}

      <div className="card">
        <div className="title" style={{ fontSize: 13, marginBottom: 8 }}>
          Recent Sessions
        </div>
        <div className="historyList">
          {history.length === 0 && <div className="subtitle">No history loaded yet.</div>}
          {history.map((item) => (
            <div key={item.sessionId} className="historyItem">
              <div>
                {item.platform} | {item.latestLabel}
              </div>
              <div className="subtitle">Score {item.latestScore}</div>
              <div className="subtitle">{item.pageUrl.slice(0, 55)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const rootElement = document.getElementById("root");
if (rootElement) {
  createRoot(rootElement).render(
    <React.StrictMode>
      <PopupApp />
    </React.StrictMode>
  );
}
