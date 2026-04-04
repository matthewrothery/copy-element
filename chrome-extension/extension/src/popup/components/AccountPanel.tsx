import { ChevronLeft } from "lucide-react";
import { useEffect, useState, type JSX } from "react";
import {
  getAuthStateFromBackground,
  getInstallIdFromBackground,
  openSignInPage,
  refreshPlanFromBackground,
  signOutFromBackground,
} from "../api";

interface AccountPanelProps {
  onBack?: () => void;
  onSignedInChange?: (signedIn: boolean) => void;
}

type AccountView = "loading" | "signed-out" | "signed-in";

export function AccountPanel({ onBack, onSignedInChange }: AccountPanelProps): JSX.Element {
  const [view, setView] = useState<AccountView>("loading");
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userPlan, setUserPlan] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    void (async () => {
      try {
        await refreshPlanFromBackground().catch(() => {});
        const state = await getAuthStateFromBackground();
        if (state.signed_in) {
          setUserEmail(state.user_email);
          setUserPlan(state.user_plan);
          setView("signed-in");
          onSignedInChange?.(true);
        } else {
          setView("signed-out");
          onSignedInChange?.(false);
        }
      } catch {
        setView("signed-out");
      }
    })();
  }, []);

  async function handleSignIn(): Promise<void> {
    setError("");
    try {
      const installId = await getInstallIdFromBackground();
      openSignInPage(installId);
    } catch {
      setError("Failed to open sign-in page. Please try again.");
    }
  }

  async function handleSignOut(): Promise<void> {
    setError("");
    try {
      await signOutFromBackground();
      setUserEmail(null);
      setUserPlan(null);
      setView("signed-out");
      onSignedInChange?.(false);
    } catch {
      setError("Failed to sign out. Please try again.");
    }
  }

  return (
    <>
      <div className="settings-header">
        {onBack && (
          <button
            type="button"
            className="settings-back-button"
            onClick={onBack}
            aria-label="Back to main"
          >
            <ChevronLeft size={20} aria-hidden />
          </button>
        )}
        <h2 className="settings-title">Account</h2>
      </div>

      {view === "loading" && (
        <p className="settings-description">Loading…</p>
      )}

      {view === "signed-out" && (
        <section className="settings-panel" aria-label="Sign in">
          <div className="settings-section">
            <button
              type="button"
              className="account-signin-btn"
              onClick={() => void handleSignIn()}
            >
              Sign in
            </button>
            {error && <p className="account-error">{error}</p>}
          </div>
        </section>
      )}

      {view === "signed-in" && (
        <section className="settings-panel" aria-label="Account info">
          <div className="settings-section">
            {userEmail && (
              <p className="account-email-display">{userEmail}</p>
            )}
            {userPlan && (
              <span
                className={`account-plan-badge ${
                  userPlan.toLowerCase() === "pro"
                    ? "account-plan-pro"
                    : "account-plan-free"
                }`}
              >
                {userPlan.charAt(0).toUpperCase() + userPlan.slice(1)}
              </span>
            )}
            {error && <p className="account-error">{error}</p>}
            <button
              type="button"
              className="account-signout-btn"
              onClick={() => void handleSignOut()}
            >
              Sign out
            </button>
          </div>
        </section>
      )}
    </>
  );
}
