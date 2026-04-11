import { useEffect, useMemo, useState, type JSX } from "react";
import {
  RuntimeRequestError,
  getAuthStateFromBackground,
  getInstallIdFromBackground,
  getSnippetsFromBackground,
  openLibraryInNewTab,
  openSignInPage,
  refreshPlanFromBackground,
  startCapture,
  trySilentAuthFromBackground,
} from "./api";
import { isCapturableUrl, getUnsupportedPageMessage } from "../shared/utils/capture-url";
import { trackPopupEvent } from "../shared/analytics";
import type { CaptureMode } from "../shared/types/messages";
import { Settings, User } from "lucide-react";
import { Header } from "./components/Header";
import { MainPanel } from "./components/MainPanel";
import { SettingsPanel, type UiPreferences } from "./components/SettingsPanel";
import { AccountPanel } from "./components/AccountPanel";
import { Toast } from "./components/Toast";
import { SignInPromoModal } from "./components/SignInPromoModal";
import { UpgradePromoModal } from "./components/UpgradePromoModal";
import type { Snippet } from "../shared/types/snippet";
import {
  FREE_TIER_MONTHLY_CAPTURE_LIMIT,
  getGuestUsage,
  getUsageThisMonth,
  PAID_PLANS,
  SAVES_THIS_MONTH_KEY
} from "../shared/usage";
import { buildSnippetPrompt } from "../shared/utils/prompt-builder";
import { buildCopyHtml } from "../shared/utils/preview-srcdoc-builder";
import { UsageMeter } from "./components/UsageMeter";
import { openUpgradePage } from "./api";

type PopupView = "home" | "settings" | "account";
type PaywallView = "signin-nudge" | "signin-gate" | "upgrade-gate" | null;

const SIGNIN_NUDGE_KEY = "element-armory-signin-nudge-shown";
const GUEST_NUDGE_THRESHOLD = 5;
const PREFERENCES_KEY = "element-armory-ui-preferences";
const DEFAULT_PREFERENCES: UiPreferences = {
  thumbnailSize: "balanced",
  assetReplacementMode: "smart",
  exportFormat: "html",
  captureTheme: "default",
  captureViewport: "default",
  defaultCaptureMode: "element",
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
  const [storedUsage, setStoredUsage] = useState<{ used: number; limit: number } | null>(null);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [paywallView, setPaywallView] = useState<PaywallView>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userPlan, setUserPlan] = useState<string | null>(null);
  const [captureBlockedReason, setCaptureBlockedReason] = useState<string | null>(null);
  const [captureError, setCaptureError] = useState<{ message: string; showReload: boolean } | null>(null);

  const snippetCount = snippets.length;
  const recentSnippets = useMemo(() => snippets.slice(0, 2), [snippets]);
  const usage = useMemo(
    () => isSignedIn ? storedUsage : getGuestUsage(snippetCount),
    [isSignedIn, snippetCount, storedUsage]
  );
  const isAtLimit = usage !== null && usage.used >= usage.limit;

  // Fire extension_opened once per popup open
  useEffect(() => {
    void trackPopupEvent('extension_opened');
  }, []);

  // Proactively check if the active tab supports capture
  useEffect(() => {
    void chrome.tabs.query({ active: true, lastFocusedWindow: true }).then(([tab]) => {
      if (!tab?.url || !isCapturableUrl(tab.url)) {
        setCaptureBlockedReason(getUnsupportedPageMessage(tab?.url));
      }
    });
  }, []);

  // One-time nudge: prompt guest users to create an account after N captures
  useEffect(() => {
    if (!hasStorageLocal || isSignedIn || snippetCount < GUEST_NUDGE_THRESHOLD) return;
    void chrome.storage.local.get(SIGNIN_NUDGE_KEY).then((result) => {
      if (!result[SIGNIN_NUDGE_KEY]) {
        setPaywallView("signin-nudge");
      }
    });
  }, [hasStorageLocal, isSignedIn, snippetCount]);

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
    const loadSnippets = (): void => {
      void getSnippetsFromBackground()
        .then((data) => setSnippets(Array.isArray(data) ? data : []))
        .catch(() => setSnippets([]));
    };

    loadSnippets();

    if (typeof chrome !== "undefined" && chrome.storage?.onChanged?.addListener) {
      const listener = (
        changes: { [key: string]: chrome.storage.StorageChange },
        areaName: string
      ): void => {
        if (areaName === "local" && "element-capture-snippet-ids" in changes) {
          loadSnippets();
        }
      };
      chrome.storage.onChanged.addListener(listener);
      return () => chrome.storage.onChanged.removeListener(listener);
    }
  }, []);

  useEffect(() => {
    if (!isSignedIn) return;
    const loadUsage = (): void => {
      void getUsageThisMonth().then(setStoredUsage);
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
  }, [isSignedIn]);

  useEffect(() => {
    void (async () => {
      try {
        const state = await getAuthStateFromBackground();
        setIsSignedIn(state.signed_in);
        setIsPaid(state.signed_in && PAID_PLANS.includes(state.user_plan as never));
        if (state.signed_in) {
          setUserEmail(state.user_email);
          setUserPlan(state.user_plan);
        } else {
          // Not signed in — attempt silent auth using the website session cookie.
          // If it succeeds, the storage change listener will re-render the signed-in state.
          void trySilentAuthFromBackground().catch(() => {});
        }
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
          if (!changes["element-armory-auth-token"].newValue) {
            setIsSignedIn(false);
            setIsPaid(false);
            setUserEmail(null);
            setUserPlan(null);
          } else {
            void getAuthStateFromBackground().then((state) => {
              setIsSignedIn(state.signed_in);
              setIsPaid(state.signed_in && PAID_PLANS.includes(state.user_plan as never));
              if (state.signed_in) {
                setUserEmail(state.user_email);
                setUserPlan(state.user_plan);
              }
            }).catch(() => {});
          }
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

  function dismissPaywall(): void {
    if (paywallView === "signin-nudge" && hasStorageLocal) {
      void chrome.storage.local.set({ [SIGNIN_NUDGE_KEY]: true });
    }
    setPaywallView(null);
  }

  async function handleCapture(mode: CaptureMode): Promise<void> {
    if (isAtLimit) {
      const limitType = !isSignedIn ? 'guest_library' : 'free_monthly';
      void trackPopupEvent('limit_reached', { limit_type: limitType });
      setPaywallView(!isSignedIn ? "signin-gate" : "upgrade-gate");
      return;
    }
    setCaptureError(null);
    setLoadingState(true);
    try {
      await startCapture(mode);
      window.close();
    } catch (error: unknown) {
      if (error instanceof RuntimeRequestError) {
        if (error.code === "CONTENT_SCRIPT_UNREACHABLE") {
          setCaptureError({ message: "Reload the page to enable capture.", showReload: true });
        } else if (error.code === "UNSUPPORTED_TAB_URL") {
          setCaptureError({ message: "Capture isn't supported on this page.", showReload: false });
        } else if (error.code === "NO_ACTIVE_TAB") {
          setCaptureError({ message: "No active tab found.", showReload: false });
        } else {
          setToastMessage("Unable to start capture.");
        }
      } else {
        setToastMessage("Unable to start capture.");
      }
    } finally {
      setLoadingState(false);
    }
  }

  async function handleReloadPage(): Promise<void> {
    const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    if (tab?.id) await chrome.tabs.reload(tab.id);
    window.close();
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
      void trackPopupEvent('element_exported', { format: 'prompt_basic' });
    } catch {
      setToastMessage("Failed to copy prompt");
    }
  }

  async function handleCopyCode(snippet: Snippet): Promise<void> {
    try {
      await copyToClipboard(buildCopyHtml(snippet));
      setToastMessage("Code copied to clipboard");
      void trackPopupEvent('element_exported', { format: 'html' });
    } catch {
      setToastMessage("Failed to copy code");
    }
  }

  return (
    <div className="app-shell">
      <Header
        onCapture={(mode) => void handleCapture(mode)}
        defaultCaptureMode={preferences.defaultCaptureMode}
        captureDisabled={loadingState || captureBlockedReason !== null}
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

      {(captureBlockedReason !== null || captureError !== null) && (
        <div className="capture-error-banner" role="status">
          <span className="capture-error-message">
            {captureBlockedReason ?? captureError!.message}
          </span>
          {captureError?.showReload && (
            <button
              type="button"
              className="capture-error-reload"
              onClick={() => void handleReloadPage()}
            >
              Reload Page
            </button>
          )}
        </div>
      )}

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
            onCopyCode={handleCopyCode}
            isGuest={!isPaid}
          />
        )}
      </main>
      {view === "home" && !isPaid && (
        <UsageMeter
          used={usage?.used ?? 0}
          limit={usage?.limit ?? FREE_TIER_MONTHLY_CAPTURE_LIMIT}
        />
      )}
      <footer className="footer">
        {isSignedIn && userEmail ? (
          <span className="footer-user-info">
            <span className="footer-email">{userEmail}</span>
            {userPlan && (
              <span className={`footer-plan-badge footer-plan-${userPlan.toLowerCase()}`}>
                {userPlan.charAt(0).toUpperCase() + userPlan.slice(1)}
              </span>
            )}
          </span>
        ) : (
          <span>v{extensionVersion}</span>
        )}
        <button
          type="button"
          className={`footer-account-button${isSignedIn ? " footer-account-button--signed-in" : ""}`}
          onClick={() => {
            if (!isSignedIn) {
              void getInstallIdFromBackground().then(openSignInPage).catch(() => {});
            } else {
              chrome.tabs.create({ url: chrome.runtime.getURL("app.html#/plans") });
            }
          }}
          aria-label="Open account"
        >
          <User size={18} aria-hidden />
        </button>
      </footer>

      {toastMessage && <Toast message={toastMessage} />}

      {(paywallView === "signin-nudge" || paywallView === "signin-gate") && (
        <SignInPromoModal
          onSignIn={() => {
            void getInstallIdFromBackground().then(openSignInPage).catch(() => {});
            dismissPaywall();
          }}
          onClose={dismissPaywall}
          onShown={() => void trackPopupEvent('signin_modal_shown', { source: paywallView })}
        />
      )}
      {paywallView === "upgrade-gate" && (
        <UpgradePromoModal
          onUpgrade={() => { openUpgradePage(); dismissPaywall(); }}
          onClose={dismissPaywall}
          onShown={() => void trackPopupEvent('upgrade_modal_shown', { source: 'popup_limit' })}
        />
      )}
    </div>
  );
}
