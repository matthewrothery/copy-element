import { useEffect, useMemo, useState, type JSX } from "react";
import {
  formatCaptureStartError,
  getAuthStateFromBackground,
  getInstallIdFromBackground,
  getSnippetsFromBackground,
  openLibraryInNewTab,
  openSignInPage,
  startCapture
} from "./api";
import { Settings, User } from "lucide-react";
import { Header } from "./components/Header";
import { MainPanel } from "./components/MainPanel";
import { SettingsPanel, type UiPreferences } from "./components/SettingsPanel";
import { AccountPanel } from "./components/AccountPanel";
import { Toast } from "./components/Toast";
import type { Snippet } from "../shared/types/snippet";
import {
  FREE_TIER_MONTHLY_CAPTURE_LIMIT,
  getUsageThisMonth,
  SAVES_THIS_MONTH_KEY
} from "../shared/usage";
import { buildSnippetPrompt } from "../shared/utils/prompt-builder";
import { UsageMeter } from "./components/UsageMeter";

type PopupView = "home" | "settings" | "account";
const PREFERENCES_KEY = "element-armory-ui-preferences";
const DEFAULT_PREFERENCES: UiPreferences = {
  thumbnailSize: "balanced",
  assetReplacementMode: "smart",
  exportFormat: "html",
  captureTheme: "default",
  captureViewport: "default",
};

function copyToClipboard(value: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const textarea = document.createElement("textarea");
    textarea.value = value;
    textarea.style.cssText = "position:fixed;top:0;left:0;opacity:0;pointer-events:none";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    try {
      const ok = document.execCommand("copy");
      document.body.removeChild(textarea);
      if (ok) {
        resolve();
      } else {
        reject(new Error("Copy failed"));
      }
    } catch (err) {
      document.body.removeChild(textarea);
      reject(err);
    }
  });
}

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
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [preferences, setPreferences] = useState<UiPreferences>(DEFAULT_PREFERENCES);
  const [loadingState, setLoadingState] = useState(false);
  const [usage, setUsage] = useState<{ used: number; limit: number } | null>(null);
  const [isSignedIn, setIsSignedIn] = useState(false);

  const snippetCount = snippets.length;
  const recentSnippets = useMemo(() => snippets.slice(0, 2), [snippets]);

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
        const data = await getSnippetsFromBackground();
        setSnippets(Array.isArray(data) ? data : []);
      } catch {
        setSnippets([]);
      }
    })();
  }, []);

  useEffect(() => {
    const loadUsage = (): void => {
      void getUsageThisMonth().then(setUsage);
    };
    loadUsage();
    if (typeof chrome !== "undefined" && chrome.storage?.onChanged?.addListener) {
      const listener = (
        changes: { [key: string]: chrome.storage.StorageChange },
        areaName: string
      ): void => {
        if (areaName === "local" && changes[SAVES_THIS_MONTH_KEY] !== undefined) {
          loadUsage();
        }
      };
      chrome.storage.onChanged.addListener(listener);
      return () => chrome.storage.onChanged.removeListener(listener);
    }
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        const state = await getAuthStateFromBackground();
        setIsSignedIn(state.signed_in);
      } catch {
        // ignore
      }
    })();

    if (typeof chrome !== "undefined" && chrome.storage?.onChanged?.addListener) {
      const listener = (
        changes: { [key: string]: chrome.storage.StorageChange },
        areaName: string
      ): void => {
        if (areaName === "local" && "element-armory-auth-token" in changes) {
          setIsSignedIn(!!changes["element-armory-auth-token"].newValue);
        }
      };
      chrome.storage.onChanged.addListener(listener);
      return () => chrome.storage.onChanged.removeListener(listener);
    }
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

  function handleOpenLibrary(snippetId?: string): void {
    openLibraryInNewTab(snippetId);
  }

  async function handleCopyPrompt(snippet: Snippet): Promise<void> {
    try {
      await copyToClipboard(buildSnippetPrompt(snippet));
      setToastMessage("Ready paste into your AI tool of choice!");
    } catch {
      setToastMessage("Failed to copy prompt");
    }
  }

  return (
    <div className="app-shell">
      <Header
        onCapture={() => void handleCapture()}
        onLibrary={handleLibrary}
        onToggleSettings={() => setView((current) => (current === "home" ? "settings" : "home"))}
        isSettingsView={view === "settings"}
      >
                    <div className="popup-flow">
              <h2 className="popup-flow-title">Capture flow</h2>
              <ol className="popup-flow-list">
                <li>Click <strong>Capture Element</strong>.</li>
                <li>Select any UI block on a page.</li>
                <li>Save to library or copy as HTML/JSX.</li>
              </ol>
            </div>
            </Header>
      
      <main className="main-content">
        {view === "settings" ? (
          <SettingsPanel
            preferences={preferences}
            onChange={setPreferences}
            onBack={() => setView("home")}
          />
        ) : view === "account" ? (
          <AccountPanel
            onBack={() => setView("home")}
            onSignedInChange={setIsSignedIn}
          />
        ) : (
          <MainPanel
            snippetCount={snippetCount}
            recentSnippets={recentSnippets}
            onOpenLibrary={handleOpenLibrary}
            onCopyPrompt={handleCopyPrompt}
          />
        )}
      </main>
      {view === "home" && (
        <UsageMeter
          used={usage?.used ?? 0}
          limit={usage?.limit ?? FREE_TIER_MONTHLY_CAPTURE_LIMIT}
        />
      )}
      <footer className="footer">
        <button
          type="button"
          className="footer-settings-button"
          onClick={() => setView("settings")}
          aria-label="Open settings"
        >
          <Settings size={18} aria-hidden />
        </button>
        <span>v{extensionVersion}</span>
        <button
          type="button"
          className={`footer-account-button${isSignedIn ? " footer-account-button--signed-in" : ""}`}
          onClick={() => {
            if (!isSignedIn) {
              void getInstallIdFromBackground().then(openSignInPage).catch(() => {});
            } else {
              setView((v) => (v === "account" ? "home" : "account"));
            }
          }}
          aria-label="Open account"
        >
          <User size={18} aria-hidden />
        </button>
      </footer>

      {toastMessage && <Toast message={toastMessage} />}
    </div>
  );
}
