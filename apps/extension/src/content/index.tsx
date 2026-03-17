import React from "react";
import { createRoot, Root } from "react-dom/client";
import { AdapterDiagnostics, PlatformName, SessionStateResponse } from "@truststream/shared";
import { adapterByPlatform, resolveAdapter } from "../adapters";
import { SiteAdapter } from "../adapters/types";
import { TrustStreamMessage } from "../lib/messages";
import { OverlayApp } from "../overlay/OverlayApp";
import { overlayStyles } from "../overlay/overlay-styles";

type ActiveOverlay = {
  host: HTMLDivElement;
  root: Root;
  sessionId: string;
  platform: PlatformName;
  adapter: SiteAdapter;
  diagnostics: AdapterDiagnostics;
  observerCleanup?: () => void;
  intervalId?: number;
  state: SessionStateResponse | null;
  sentHashes: Set<string>;
  audioCapture?: {
    enabled: boolean;
    streamId?: string;
    reason?: string;
  };
  audioRecorderCleanup?: () => void;
};

let activeOverlay: ActiveOverlay | null = null;

function hashText(text: string) {
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  }
  return `${hash}`;
}

function normalizeChunk(input: string) {
  return input.replace(/\s+/g, " ").trim();
}

function segmentChunk(input: string) {
  const normalized = normalizeChunk(input);
  if (!normalized) return [];

  const segments = normalized
    .split(/(?<=[.!?])\s+|\s+\|\s+|[\n\r]+/)
    .map((part) => part.trim())
    .filter((part) => part.length >= 10)
    .slice(0, 6);

  return segments.length > 0 ? segments : [normalized];
}

function emitChunk(sessionId: string, text: string, source: "dom_caption" | "dom_product" | "manual" | "audio_stt") {
  if (!text.trim()) return;
  chrome.runtime.sendMessage(
    {
      type: "CHUNK_DETECTED",
      sessionId,
      payload: {
        text,
        source,
        visiblePageData: activeOverlay?.adapter.extractProductInfo(document)
      }
    } satisfies TrustStreamMessage,
    () => {
      // Ignore transient runtime channel errors (e.g. worker restart).
      void chrome.runtime.lastError;
    }
  );
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        reject(new Error("Failed to encode audio chunk."));
        return;
      }
      const [, base64 = ""] = result.split(",");
      resolve(base64);
    };
    reader.onerror = () => reject(reader.error ?? new Error("FileReader failed."));
    reader.readAsDataURL(blob);
  });
}

function pickPrimaryVideo(doc: Document): HTMLVideoElement | null {
  const videos = Array.from(doc.querySelectorAll("video"));
  if (videos.length === 0) return null;
  const visible = videos.filter((video) => {
    const rect = video.getBoundingClientRect();
    return rect.width > 200 && rect.height > 200 && rect.bottom > 0 && rect.right > 0;
  });
  const candidates = visible.length > 0 ? visible : videos;
  candidates.sort((a, b) => {
    const areaA = a.getBoundingClientRect().width * a.getBoundingClientRect().height;
    const areaB = b.getBoundingClientRect().width * b.getBoundingClientRect().height;
    return areaB - areaA;
  });
  return candidates[0] ?? null;
}

function startVideoAudioTranscriptProbe() {
  if (!activeOverlay) return;
  const video = pickPrimaryVideo(document);
  if (!video) {
    activeOverlay.audioCapture = {
      enabled: false,
      reason: "No playable video element detected for audio transcript."
    };
    renderOverlay();
    return;
  }

  const captureFn = (video as HTMLVideoElement & {
    captureStream?: () => MediaStream;
    mozCaptureStream?: () => MediaStream;
  }).captureStream
    ? (video as HTMLVideoElement & { captureStream: () => MediaStream }).captureStream
    : (video as HTMLVideoElement & { mozCaptureStream?: () => MediaStream }).mozCaptureStream;

  if (!captureFn) {
    activeOverlay.audioCapture = {
      enabled: false,
      reason: "Browser does not allow captureStream on this video."
    };
    renderOverlay();
    return;
  }

  let stream: MediaStream;
  try {
    stream = captureFn.call(video);
  } catch {
    activeOverlay.audioCapture = {
      enabled: false,
      reason: "captureStream failed on this page."
    };
    renderOverlay();
    return;
  }

  const audioTracks = stream.getAudioTracks();
  if (audioTracks.length === 0) {
    activeOverlay.audioCapture = {
      enabled: false,
      reason: "Video stream has no readable audio track."
    };
    renderOverlay();
    return;
  }

  let recorder: MediaRecorder;
  try {
    const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
      ? "audio/webm;codecs=opus"
      : "audio/webm";
    recorder = new MediaRecorder(stream, { mimeType });
  } catch {
    activeOverlay.audioCapture = {
      enabled: false,
      reason: "MediaRecorder audio capture unavailable in this context."
    };
    renderOverlay();
    return;
  }

  activeOverlay.audioCapture = {
    enabled: true,
    reason: "capturing audio chunks via video.captureStream()"
  };
  renderOverlay();

  recorder.ondataavailable = async (event) => {
    if (!activeOverlay || event.data.size < 2000) return;
    try {
      const base64 = await blobToBase64(event.data);
      chrome.runtime.sendMessage(
        {
          type: "AUDIO_CHUNK_DETECTED",
          sessionId: activeOverlay.sessionId,
          payload: {
            audioBase64: base64,
            mimeType: event.data.type || "audio/webm"
          }
        } satisfies TrustStreamMessage,
        () => {
          void chrome.runtime.lastError;
        }
      );
    } catch {
      // Ignore conversion errors for an individual chunk.
    }
  };

  recorder.start(4500);

  activeOverlay.audioRecorderCleanup = () => {
    try {
      if (recorder.state !== "inactive") recorder.stop();
    } catch {
      // no-op
    }
    stream.getTracks().forEach((track) => track.stop());
  };
}

function attachDragBehavior(host: HTMLDivElement, shadowRoot: ShadowRoot) {
  let dragging = false;
  let offsetX = 0;
  let offsetY = 0;
  const handle = shadowRoot.querySelector("[data-drag-handle]") as HTMLElement | null;
  if (!handle) return;

  handle.addEventListener("mousedown", (event) => {
    dragging = true;
    const rect = host.getBoundingClientRect();
    offsetX = event.clientX - rect.left;
    offsetY = event.clientY - rect.top;
    host.style.right = "auto";
  });

  window.addEventListener("mousemove", (event) => {
    if (!dragging) return;
    host.style.left = `${Math.max(6, event.clientX - offsetX)}px`;
    host.style.top = `${Math.max(6, event.clientY - offsetY)}px`;
  });

  window.addEventListener("mouseup", () => {
    dragging = false;
  });
}

function renderOverlay() {
  if (!activeOverlay) return;
  const { root } = activeOverlay;

  root.render(
    <OverlayApp
      sessionId={activeOverlay.sessionId}
      platform={activeOverlay.platform}
      diagnosticsMode={activeOverlay.diagnostics.extractionMode}
      state={activeOverlay.state}
      audioCapture={activeOverlay.audioCapture}
      onSendManualChunk={(text) => emitChunk(activeOverlay.sessionId, text, "manual")}
      onStop={() => {
        chrome.runtime.sendMessage({ type: "STOP_ANALYSIS" } satisfies TrustStreamMessage, () => {
          void chrome.runtime.lastError;
        });
      }}
    />
  );
}

function startObservers() {
  if (!activeOverlay) return;

  const processChunks = (chunks: string[], source: "dom_caption" | "dom_product") => {
    chunks.forEach((chunk) => {
      const segments = segmentChunk(chunk);
      segments.forEach((segment) => {
        const hash = hashText(segment);
        if (activeOverlay?.sentHashes.has(hash)) return;
        activeOverlay?.sentHashes.add(hash);
        emitChunk(activeOverlay!.sessionId, segment, source);
      });
    });
  };

  activeOverlay.observerCleanup = activeOverlay.adapter.observeDomChanges(document, (chunks) => {
    processChunks(chunks, "dom_caption");
  });

  activeOverlay.intervalId = window.setInterval(() => {
    if (!activeOverlay) return;
    const chunks = activeOverlay.adapter.extractVisibleText(document);
    processChunks(chunks, "dom_caption");
    activeOverlay.diagnostics = activeOverlay.adapter.diagnostics(document);
    renderOverlay();
  }, 4200);

  // Attempt actual transcript capture from the live video audio as a stronger fallback.
  startVideoAudioTranscriptProbe();
}

function stopOverlay() {
  if (!activeOverlay) return;

  if (activeOverlay.observerCleanup) activeOverlay.observerCleanup();
  if (activeOverlay.intervalId) window.clearInterval(activeOverlay.intervalId);
  if (activeOverlay.audioRecorderCleanup) activeOverlay.audioRecorderCleanup();
  activeOverlay.root.unmount();
  activeOverlay.host.remove();
  activeOverlay = null;
}

function startOverlay(params: {
  sessionId: string;
  platform: PlatformName;
  diagnostics: AdapterDiagnostics;
  audioCapture?: {
    enabled: boolean;
    streamId?: string;
    reason?: string;
  };
}) {
  stopOverlay();

  const host = document.createElement("div");
  host.style.position = "fixed";
  host.style.top = "18px";
  host.style.right = "18px";
  host.style.zIndex = "2147483647";
  document.body.appendChild(host);

  const shadowRoot = host.attachShadow({ mode: "open" });
  const styleEl = document.createElement("style");
  styleEl.textContent = overlayStyles;
  shadowRoot.appendChild(styleEl);

  const container = document.createElement("div");
  container.className = "truststream-root";
  shadowRoot.appendChild(container);

  const root = createRoot(container);
  const adapter = adapterByPlatform(params.platform) ?? resolveAdapter(window.location.href);
  activeOverlay = {
    host,
    root,
    sessionId: params.sessionId,
    platform: params.platform,
    adapter,
    diagnostics: params.diagnostics,
    audioCapture: params.audioCapture,
    sentHashes: new Set(),
    state: null
  };

  renderOverlay();
  attachDragBehavior(host, shadowRoot);
  startObservers();
}

chrome.runtime.onMessage.addListener((message: TrustStreamMessage) => {
  if (message.type === "TRUSTSTREAM_START") {
    startOverlay({
      sessionId: message.sessionId,
      platform: message.platform,
      diagnostics: message.diagnostics,
      audioCapture: message.audioCapture
    });
  }

  if (message.type === "TRUSTSTREAM_STOP") {
    stopOverlay();
  }

  if (message.type === "ANALYSIS_UPDATE" && activeOverlay?.sessionId === message.sessionId) {
    activeOverlay.state = message.state;
    renderOverlay();
  }

  if (message.type === "ANALYSIS_ERROR" && activeOverlay?.sessionId === message.sessionId) {
    activeOverlay.state = {
      ...(activeOverlay.state ?? {
        sessionId: message.sessionId,
        status: "error",
        platform: activeOverlay.platform,
        pageUrl: window.location.href,
        updatedAt: new Date().toISOString(),
        trustScore: {
          score: 0,
          label: "high_risk",
          confidence: "Low",
          explanation: { positiveSignals: [], negativeSignals: [message.message], weightedFactors: {} }
        },
        claims: [],
        riskFlags: [],
        suggestedQuestions: [],
        summary: {
          rollingSummary: message.message,
          buyerGuidance: [],
          keyChanges: [message.message]
        },
        chunkCount: 0,
        transcriptFeed: []
      }),
      status: "error"
    };
    renderOverlay();
  }
});
