import {
  SessionHistoryItem,
  SessionStartResponse,
  SessionStateResponse
} from "@truststream/shared";
import { getSettings, setSettings } from "../lib/storage";
import { detectPlatform } from "../lib/platform";
import { TrustStreamMessage } from "../lib/messages";

type TabSessionState = {
  sessionId: string;
  status: "idle" | "listening" | "analyzing" | "stopped" | "error";
  platform: string;
};

const activeSessions = new Map<number, TabSessionState>();

function isRestrictedUrl(url: string) {
  return (
    url.startsWith("chrome://") ||
    url.startsWith("edge://") ||
    url.startsWith("about:") ||
    url.startsWith("chrome-extension://")
  );
}

async function safeSendTabMessage(tabId: number, message: TrustStreamMessage) {
  try {
    await chrome.tabs.sendMessage(tabId, message);
    return { delivered: true as const };
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    // Content script may not exist yet on this tab (or host is restricted).
    return { delivered: false as const, detail };
  }
}

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed: ${res.status}`);
  }
  return (await res.json()) as T;
}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed: ${res.status}`);
  }
  return (await res.json()) as T;
}

async function startAnalysisForTab(tabId?: number) {
  const tab = tabId ? await chrome.tabs.get(tabId) : await getActiveTab();
  if (!tab?.id || !tab.url) {
    throw new Error("No active tab available for analysis.");
  }
  if (isRestrictedUrl(tab.url)) {
    throw new Error("This browser page cannot be analyzed. Open a regular website tab.");
  }

  const settings = await getSettings();
  const platform = detectPlatform(tab.url);
  const response = await postJson<SessionStartResponse>(`${settings.backendUrl}/api/session/start`, {
    platform,
    pageUrl: tab.url,
    tabId: tab.id,
    title: tab.title,
    language: settings.language,
    sensitivity: settings.sensitivity
  });

  activeSessions.set(tab.id, {
    sessionId: response.sessionId,
    status: "listening",
    platform
  });

  chrome.action.setBadgeText({ tabId: tab.id, text: "ON" });
  chrome.action.setBadgeBackgroundColor({ tabId: tab.id, color: "#0f766e" });

  let audioCapture: { enabled: boolean; streamId?: string; reason?: string } = { enabled: false };
  if (settings.audioCaptureEnabled) {
    try {
      const streamId = await chrome.tabCapture.getMediaStreamId({
        targetTabId: tab.id
      });
      audioCapture = {
        enabled: true,
        streamId
      };
    } catch {
      audioCapture = {
        enabled: false,
        reason: "tabCapture unavailable for this tab/context"
      };
    }
  }

  const overlayDelivery = await safeSendTabMessage(tab.id, {
    type: "TRUSTSTREAM_START",
    sessionId: response.sessionId,
    backendUrl: settings.backendUrl,
    platform,
    diagnostics: {
      platform,
      captionSelectorsChecked: [],
      extractionMode: "limited_visibility",
      lastExtractionCount: 0
    },
    audioCapture
  } satisfies TrustStreamMessage);

  return {
    ok: true,
    sessionId: response.sessionId,
    platform,
    overlayAttached: overlayDelivery.delivered,
    warning: overlayDelivery.delivered
      ? undefined
      : "Overlay receiver not available yet. Reload the tab and start again."
  };
}

async function stopAnalysisForTab(tabId?: number) {
  const tab = tabId ? await chrome.tabs.get(tabId) : await getActiveTab();
  if (!tab?.id) return { ok: false, message: "No active tab." };

  const active = activeSessions.get(tab.id);
  if (!active) return { ok: false, message: "No active session." };

  const settings = await getSettings();
  await postJson(`${settings.backendUrl}/api/session/${active.sessionId}/stop`, {});
  activeSessions.delete(tab.id);
  chrome.action.setBadgeText({ tabId: tab.id, text: "" });

  await safeSendTabMessage(tab.id, {
    type: "TRUSTSTREAM_STOP",
    sessionId: active.sessionId
  } satisfies TrustStreamMessage);

  return { ok: true };
}

async function relayChunk(
  senderTabId: number,
  sessionId: string,
  payload: TrustStreamMessage & { type: "CHUNK_DETECTED" }
) {
  const settings = await getSettings();
  const state = await postJson<SessionStateResponse>(
    `${settings.backendUrl}/api/session/${sessionId}/transcript-chunk`,
    payload.payload
  );

  activeSessions.set(senderTabId, {
    sessionId,
    status: state.status,
    platform: state.platform
  });

  await safeSendTabMessage(senderTabId, {
    type: "ANALYSIS_UPDATE",
    sessionId,
    state
  } satisfies TrustStreamMessage);
}

async function relayAudioChunk(
  senderTabId: number,
  sessionId: string,
  payload: TrustStreamMessage & { type: "AUDIO_CHUNK_DETECTED" }
) {
  const settings = await getSettings();
  const response = await postJson<{ transcript: string | null; state?: SessionStateResponse }>(
    `${settings.backendUrl}/api/session/${sessionId}/audio-chunk`,
    payload.payload
  );

  if (!response.state) return;

  activeSessions.set(senderTabId, {
    sessionId,
    status: response.state.status,
    platform: response.state.platform
  });

  await safeSendTabMessage(senderTabId, {
    type: "ANALYSIS_UPDATE",
    sessionId,
    state: response.state
  } satisfies TrustStreamMessage);
}

chrome.runtime.onMessage.addListener((message: TrustStreamMessage, sender, sendResponse) => {
  (async () => {
    try {
      if (message.type === "START_ANALYSIS") {
        sendResponse(await startAnalysisForTab(message.tabId));
        return;
      }
      if (message.type === "STOP_ANALYSIS") {
        sendResponse(await stopAnalysisForTab(message.tabId));
        return;
      }
      if (message.type === "REQUEST_STATUS") {
        const tab = message.tabId ? await chrome.tabs.get(message.tabId) : await getActiveTab();
        if (!tab?.id) return sendResponse({ status: "error", message: "No active tab." });
        sendResponse(activeSessions.get(tab.id) ?? { status: "idle" });
        return;
      }
      if (message.type === "GET_SETTINGS") {
        sendResponse(await getSettings());
        return;
      }
      if (message.type === "SAVE_SETTINGS") {
        await setSettings(message.settings);
        sendResponse({ ok: true });
        return;
      }
      if (message.type === "GET_HISTORY") {
        const settings = await getSettings();
        const history = await getJson<SessionHistoryItem[]>(
          `${settings.backendUrl}/api/session/history?limit=20`
        );
        sendResponse(history);
        return;
      }
      if (message.type === "CHUNK_DETECTED") {
        if (sender.tab?.id) {
          await relayChunk(sender.tab.id, message.sessionId, message);
          sendResponse({ ok: true });
          return;
        }
        sendResponse({ ok: false, message: "Missing sender tab." });
        return;
      }
      if (message.type === "AUDIO_CHUNK_DETECTED") {
        if (sender.tab?.id) {
          await relayAudioChunk(sender.tab.id, message.sessionId, message);
          sendResponse({ ok: true });
          return;
        }
        sendResponse({ ok: false, message: "Missing sender tab." });
      }
    } catch (error) {
      sendResponse({
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  })();
  return true;
});
