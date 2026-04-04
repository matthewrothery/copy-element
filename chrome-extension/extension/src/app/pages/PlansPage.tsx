import { useEffect, useState, type JSX } from "react";
import { getAuthState } from "../../shared/storage/auth-storage";
import { getInstallIdFromBackground, openSignInPage, openUpgradePage, refreshPlanFromBackground } from "../../popup/api";

type PlanView = "loading" | "free" | "pro";

export function PlansPage(): JSX.Element {
  const [view, setView] = useState<PlanView>("loading");
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        await refreshPlanFromBackground().catch(() => {});
        const state = await getAuthState();
        if (!state.signed_in) {
          setView("free");
          return;
        }
        setUserEmail(state.user_email);
        const plan = state.user_plan?.toLowerCase() ?? "free";
        setView(plan === "pro" ? "pro" : "free");
      } catch {
        setView("free");
      }
    })();
  }, []);

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
        {userEmail && (
          <p className="app-page-subtitle">{userEmail}</p>
        )}
      </header>

      {view === "pro" ? (
        <section className="app-page-section">
          <div className="plan-status-card">
            <div className="plan-status-row">
              <span className="plan-status-badge plan-status-pro">Pro · Active</span>
            </div>
            <p className="app-page-text">
              You have full access to all Element Armory features including unlimited captures and MCP integration.
            </p>
            <button
              type="button"
              className="mcp-cta-btn"
              onClick={openUpgradePage}
            >
              Manage billing
            </button>
          </div>
        </section>
      ) : (
        <section className="app-page-section">
          <div className="plan-status-card">
            <div className="plan-status-row">
              <span className="plan-status-badge plan-status-free">Free</span>
            </div>
            <ul className="app-page-list">
              <li>Limited monthly captures</li>
              <li>Local library storage</li>
              <li>HTML export</li>
            </ul>
            <p className="app-page-text">
              Upgrade to Pro for unlimited captures, MCP AI integration, and cloud sync.
            </p>
            <button
              type="button"
              className="mcp-cta-btn"
              onClick={() => {
                if (!userEmail) {
                  void getInstallIdFromBackground().then(openSignInPage).catch(() => {});
                } else {
                  openUpgradePage();
                }
              }}
            >
              {userEmail ? "Upgrade to Pro" : "Sign in to upgrade"}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
