import { useEffect, useState, type JSX } from "react";
import { SettingsPanel, type UiPreferences } from "../../popup/components/SettingsPanel";

const PREFERENCES_KEY = "element-armory-ui-preferences";
const DEFAULT_PREFERENCES: UiPreferences = {
  thumbnailSize: "balanced",
  assetReplacementMode: "smart",
  exportFormat: "html",
  captureTheme: "default",
  captureViewport: "default",
  defaultCaptureMode: "element",
};

export function SettingsPage(): JSX.Element {
  const [preferences, setPreferences] = useState<UiPreferences>(DEFAULT_PREFERENCES);
  const hasStorageLocal =
    typeof chrome !== "undefined" &&
    typeof chrome.storage?.local?.get === "function" &&
    typeof chrome.storage?.local?.set === "function";

  useEffect(() => {
    if (!hasStorageLocal) {
      return;
    }
    void (async () => {
      try {
        const result = await chrome.storage.local.get(PREFERENCES_KEY);
        const stored = result[PREFERENCES_KEY];
        if (stored && typeof stored === "object") {
          setPreferences({ ...DEFAULT_PREFERENCES, ...(stored as Partial<UiPreferences>) });
        }
      } catch {
        // keep defaults
      }
    })();
  }, [hasStorageLocal]);

  useEffect(() => {
    if (!hasStorageLocal) {
      return;
    }
    void chrome.storage.local.set({ [PREFERENCES_KEY]: preferences });
  }, [hasStorageLocal, preferences]);

  return (
    <div className="app-page">
      <header className="app-page-header">
        <h1 className="app-page-title">Settings</h1>
        <p className="app-page-subtitle">
          These preferences are shared with the extension popup and apply to capture and export defaults.
        </p>
      </header>
      <SettingsPanel preferences={preferences} onChange={setPreferences} />
    </div>
  );
}
