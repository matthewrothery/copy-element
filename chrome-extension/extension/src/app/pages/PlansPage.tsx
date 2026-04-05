import { useEffect, useState, type JSX } from "react";
import { getAuthState } from "../../shared/storage/auth-storage";
import { getInstallIdFromBackground, openBillingPortal, openSignInPage, refreshPlanFromBackground, signOutFromBackground } from "../../popup/api";
import { SERVER_URL } from "../../shared/server-url";

type PlanView = "loading" | "free" | "pro";

export function PlansPage(): JSX.Element {
  const [view, setView] = useState<PlanView>("loading");
  const [userEmail, setUserEmail] = useState<string | null>(null);

  async function checkAuthState(): Promise<void> {
    try {
      await refreshPlanFromBackground().catch(() => {});
      const state = await getAuthState();
      if (!state.signed_in) {
        setView("free");
        setUserEmail(null);
        return;
      }
      setUserEmail(state.user_email);
      const plan = state.user_plan?.toLowerCase() ?? "free";
      setView(plan === "pro" ? "pro" : "free");
    } catch {
      setView("free");
    }
  }

  useEffect(() => {
    void checkAuthState();

    function onStorageChanged(changes: Record<string, chrome.storage.StorageChange>): void {
      if ("element-armory-auth-token" in changes) {
        void checkAuthState();
      }
    }

    chrome.storage.onChanged.addListener(onStorageChanged);
    return () => { chrome.storage.onChanged.removeListener(onStorageChanged); };
  }, []);

  function handleSignOut(): void {
    void signOutFromBackground()
      .then(() => { window.location.hash = "#/library"; })
      .catch(() => { window.location.hash = "#/library"; });
  }

  function handleSignInClick(): void {
    void getInstallIdFromBackground().then(openSignInPage).catch(() => {});
  }

  function handleUpgradeClick(): void {
    chrome.tabs.create({ url: `${SERVER_URL}/pricing` });
  }

  if (view === "loading") {
    return (
      <div className="app-page">
        <div className="mcp-loading">
          <span className="mcp-spinner" aria-label="Loading" />
        </div>
      </div>
    );
  }

  return (
    <div className="app-page">
      <header className="app-page-header">
        <h1 className="app-page-title">Plans & Pricing</h1>
      </header>

      {userEmail && (
        <div className="account-detail-section">
          <span>Signed in as: {userEmail}</span>
          <button
            type="button"
            className="account-detail-signout"
            onClick={handleSignOut}
          >
            Sign out
          </button>
        </div>
      )}

      {view === "pro" ? (
        <section className="app-page-section">
          <div className="plan-status-card">
            <div className="plan-status-row">
              <span className="plan-status-badge plan-status-pro">Pro · Active</span>
            </div>
            <p className="app-page-text">You have full access to every feature.</p>
            <ul className="app-page-list app-page-list--unstyled">
              <li>✓ Unlimited captures & saved elements</li>
              <li>✓ Unlimited MCP requests</li>
              <li>✓ Advanced AI prompts</li>
              <li>✓ Full MCP access for AI editors</li>
              <li>✓ Cross-device sync</li>
            </ul>
            <button
              type="button"
              className="mcp-cta-btn"
              onClick={() => void openBillingPortal()}
            >
              Manage billing
            </button>
          </div>
        </section>
      ) : userEmail ? (
        <section className="app-page-section">
          <div className="plan-status-card">
            <div className="plan-status-row">
              <span className="plan-status-badge plan-status-free">Free</span>
            </div>
            <ul className="app-page-list app-page-list--unstyled">
              <li>✓ 25 saved elements</li>
              <li>✓ 20 captures per month</li>
              <li>✓ HTML, JSX & Tailwind export</li>
              <li>✓ Basic AI prompts</li>
              <li>✓ 10 MCP requests per month</li>
              <li>✓ Cross-device sync</li>
            </ul>
          </div>
          <div className="plan-upgrade-callout">
            <p className="plan-upgrade-label">Upgrade to Pro</p>
            <ul className="app-page-list app-page-list--unstyled">
              <li>✓ Unlimited captures & library</li>
              <li>✓ Unlimited MCP requests</li>
              <li>✓ Advanced AI prompts</li>
              <li>✓ Full MCP access for AI editors</li>
            </ul>
            <button
              type="button"
              className="mcp-cta-btn"
              onClick={handleUpgradeClick}
            >
              Upgrade to Pro
            </button>
          </div>
        </section>
      ) : (
        <section className="app-page-section">
          <div className="plan-status-card">
            <div className="plan-status-row">
              <span className="plan-status-badge plan-status-free">Guest</span>
            </div>
            <p className="app-page-text">You're saving locally. Sign in free to unlock more.</p>
            <ul className="app-page-list app-page-list--unstyled">
              <li>✓ 25 saved elements <span className="plan-feature-note">(you have 10 as guest)</span></li>
              <li>✓ Cross-device sync</li>
              <li>✓ JSX & Tailwind exports</li>
              <li>✓ AI copy prompts</li>
              <li>✓ 20 captures per month</li>
            </ul>
            <button
              type="button"
              className="mcp-cta-btn"
              onClick={handleSignInClick}
            >
              Sign in — it's free
            </button>
          </div>
          <div className="plan-upgrade-callout">
            <p className="plan-upgrade-label">Go further with Pro</p>
            <ul className="app-page-list app-page-list--unstyled">
              <li>✓ Unlimited captures & library</li>
              <li>✓ Unlimited MCP requests</li>
              <li>✓ Advanced AI prompts & MCP access</li>
            </ul>
            <button
              type="button"
              className="mcp-cta-btn mcp-cta-btn--outline"
              onClick={handleUpgradeClick}
            >
              See Pro plans
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
