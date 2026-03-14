import { useEffect, useState, type JSX } from "react";
import {
  formatCaptureStartError,
  getSnippetsFromBackground,
  openLibraryInNewTab,
  startCapture
} from "./api";
import { Header } from "./components/Header";
import { SettingsPanel, type UiPreferences } from "./components/SettingsPanel";
import { Toast } from "./components/Toast";

type PopupView = "home" | "settings";
const PREFERENCES_KEY = "element-armory-ui-preferences";
const DEFAULT_PREFERENCES: UiPreferences = {
  thumbnailSize: "balanced",
  assetReplacementMode: "smart",
  exportFormat: "html"
};

export function App(): JSX.Element {
  const extensionVersion =
    typeof chrome !== "undefined" && chrome.runtime?.getManifest
      ? chrome.runtime.getManifest().version
      : "0.1.0";
  const hasStorageLocal =
    typeof chrome !== "undefined" &&
    typeof chrome.storage?.local?.get === "function" &&
    typeof chrome.storage?.local?.set === "function";
  const [view, setView] = useState<PopupView>("home");
  const [toastMessage, setToastMessage] = useState("");
  const [snippetCount, setSnippetCount] = useState(0);
  const [preferences, setPreferences] = useState<UiPreferences>(DEFAULT_PREFERENCES);
  const [loadingState, setLoadingState] = useState(false);

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
        setToastMessage("Failed to load settings");
      }
    })();
  }, [hasStorageLocal]);

  useEffect(() => {
    if (!hasStorageLocal) {
      return;
    }
    void chrome.storage.local.set({ [PREFERENCES_KEY]: preferences });
  }, [hasStorageLocal, preferences]);

  useEffect(() => {
    void (async () => {
      try {
        const snippets = await getSnippetsFromBackground();
        setSnippetCount(snippets.length);
      } catch {
        setSnippetCount(0);
      }
    })();
  }, []);

  useEffect(() => {
    if (!toastMessage) {
      return;
    }

    const timeoutId = window.setTimeout(() => setToastMessage(""), 2000);
    return () => window.clearTimeout(timeoutId);
  }, [toastMessage]);

  async function handleCapture(): Promise<void> {
    setLoadingState(true);
    try {
      await startCapture();
      window.close();
    } catch (error: unknown) {
      setToastMessage(formatCaptureStartError(error));
    } finally {
      setLoadingState(false);
    }
  }

  function handleLibrary(): void {
    openLibraryInNewTab();
  }

  return (
    <div className="app-shell">
      <Header
        onCapture={() => void handleCapture()}
        onLibrary={handleLibrary}
        onToggleSettings={() => setView((current) => (current === "home" ? "settings" : "home"))}
        isSettingsView={view === "settings"}
      />
      <main className="main-content">
        {view === "settings" ? (
          <SettingsPanel preferences={preferences} onChange={setPreferences} />
        ) : (
          <section className="popup-home" aria-label="Capture workflow overview">
            <div className="popup-stat-card">
              <p className="popup-stat-label">Saved snippets</p>
              <p className="popup-stat-value">{snippetCount}</p>
              <p className="popup-stat-meta">Open Library to browse, copy, or delete snippets.</p>
            </div>

            <div className="popup-flow">
              <h2 className="popup-flow-title">Capture flow</h2>
              <ol className="popup-flow-list">
                <li>Click <strong>Capture Element</strong>.</li>
                <li>Select any UI block on a page.</li>
                <li>Save to library or copy as HTML/JSX.</li>
              </ol>
            </div>

            <button
              type="button"
              className="btn-primary popup-capture-button"
              onClick={() => void handleCapture()}
              disabled={loadingState}
              aria-label="Start capture flow"
            >
              {loadingState ? "Starting…" : "Start Capture"}
            </button>
          </section>
        )}
      </main>
      <footer className="footer">
        <button
          type="button"
          onClick={() => setView("settings")}
          aria-label="Open settings"
        >
          Settings
        </button>
        <button
          type="button"
          onClick={handleLibrary}
          aria-label="Open library"
        >
          Library
        </button>
        <span>v{extensionVersion}</span>
      </footer>

      {toastMessage && <Toast message={toastMessage} />}
    </div>
  );
}
