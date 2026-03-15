import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { DEFAULT_SETTINGS, ExtensionSettings, TrustStreamMessage } from "../lib/messages";
import "./styles.css";

function OptionsApp() {
  const [settings, setSettings] = useState<ExtensionSettings>(DEFAULT_SETTINGS);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    chrome.runtime.sendMessage({ type: "GET_SETTINGS" } satisfies TrustStreamMessage, (res) => {
      if (res) setSettings(res);
    });
  }, []);

  const save = () => {
    chrome.runtime.sendMessage(
      {
        type: "SAVE_SETTINGS",
        settings
      } satisfies TrustStreamMessage,
      () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 1500);
      }
    );
  };

  return (
    <div className="container">
      <div className="card">
        <div className="title">TrustStream AI Settings</div>
        <p className="subtitle">Configure backend connectivity and analysis behavior.</p>
      </div>

      <div className="card">
        <p className="subtitle">Backend URL</p>
        <input
          className="field"
          value={settings.backendUrl}
          onChange={(event) => setSettings((prev) => ({ ...prev, backendUrl: event.target.value }))}
        />
      </div>

      <div className="card">
        <p className="subtitle">Language</p>
        <input
          className="field"
          value={settings.language}
          onChange={(event) => setSettings((prev) => ({ ...prev, language: event.target.value }))}
        />
      </div>

      <div className="card">
        <p className="subtitle">Sensitivity</p>
        <select
          className="field"
          value={settings.sensitivity}
          onChange={(event) =>
            setSettings((prev) => ({
              ...prev,
              sensitivity: event.target.value as ExtensionSettings["sensitivity"]
            }))
          }
        >
          <option value="conservative">Conservative</option>
          <option value="balanced">Balanced</option>
          <option value="strict">Strict</option>
        </select>
      </div>

      <div className="card">
        <label className="row">
          <span className="subtitle">Enable audio capture mode (experimental)</span>
          <input
            type="checkbox"
            checked={settings.audioCaptureEnabled}
            onChange={(event) =>
              setSettings((prev) => ({ ...prev, audioCaptureEnabled: event.target.checked }))
            }
          />
        </label>
      </div>

      <button className="btn btnPrimary" onClick={save}>
        Save Settings
      </button>
      {saved && <p className="subtitle">Saved.</p>}
    </div>
  );
}

const rootElement = document.getElementById("root");
if (rootElement) {
  createRoot(rootElement).render(
    <React.StrictMode>
      <OptionsApp />
    </React.StrictMode>
  );
}
