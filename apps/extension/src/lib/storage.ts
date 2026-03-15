import { DEFAULT_SETTINGS, ExtensionSettings } from "./messages";

const SETTINGS_KEY = "truststream_settings";

export async function getSettings(): Promise<ExtensionSettings> {
  const current = await chrome.storage.sync.get(SETTINGS_KEY);
  return {
    ...DEFAULT_SETTINGS,
    ...(current[SETTINGS_KEY] as Partial<ExtensionSettings> | undefined)
  };
}

export async function setSettings(settings: ExtensionSettings) {
  await chrome.storage.sync.set({
    [SETTINGS_KEY]: settings
  });
}
