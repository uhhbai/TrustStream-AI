import { AdapterDiagnostics, PlatformName, SessionStateResponse } from "@truststream/shared";

export type TrustStreamMessage =
  | { type: "START_ANALYSIS"; tabId?: number }
  | { type: "STOP_ANALYSIS"; tabId?: number }
  | { type: "REQUEST_STATUS"; tabId?: number }
  | { type: "GET_SETTINGS" }
  | { type: "SAVE_SETTINGS"; settings: ExtensionSettings }
  | { type: "GET_HISTORY" }
  | {
      type: "CHUNK_DETECTED";
      sessionId: string;
      payload: {
        text: string;
        source: "dom_caption" | "dom_product" | "manual" | "audio_stt";
        visiblePageData?: {
          productName?: string;
          listedPrice?: string;
          sellerLabel?: string;
          extraText?: string[];
        };
      };
    }
  | {
      type: "AUDIO_CHUNK_DETECTED";
      sessionId: string;
      payload: {
        audioBase64: string;
        mimeType: string;
      };
    }
  | {
      type: "TRUSTSTREAM_START";
      sessionId: string;
      backendUrl: string;
      platform: PlatformName;
      diagnostics: AdapterDiagnostics;
      audioCapture?: {
        enabled: boolean;
        streamId?: string;
        reason?: string;
      };
    }
  | { type: "TRUSTSTREAM_STOP"; sessionId: string }
  | { type: "ANALYSIS_UPDATE"; sessionId: string; state: SessionStateResponse }
  | { type: "ANALYSIS_ERROR"; sessionId: string; message: string }
  | { type: "OVERLAY_READY"; platform: PlatformName }
  | { type: "SETTINGS_UPDATED" };

export interface ExtensionSettings {
  backendUrl: string;
  language: string;
  sensitivity: "conservative" | "balanced" | "strict";
  audioCaptureEnabled: boolean;
}

export const DEFAULT_SETTINGS: ExtensionSettings = {
  backendUrl: "http://localhost:8787",
  language: "en",
  sensitivity: "balanced",
  audioCaptureEnabled: false
};
