"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import {
  BillingToggle,
  CheckIcon,
  PRO_FEATURES,
  type Billing,
} from "../PricingCards/PricingCards";
import "../PricingCards/PricingCards.css";
import "./BillingContent.css";

type User = { id: string; name?: string | null; email?: string | null; image?: string | null };
type Entitlement = {
  plan_code: string;
  status: string;
  active: boolean;
  current_period_end: number | null;
  cancel_at_period_end: boolean;
} | null;

const PRO_PLAN_DATA: Record<Billing, { price: string; description: string; subtext: string }> = {
  monthly: {
    price: "19",
    description: "Full access. Cancel anytime.",
    subtext: "Billed monthly. Cancel anytime.",
  },
  yearly: {
    price: "9",
    description: "Full access. Best value.",
    subtext: "Billed yearly ($108/yr). Save $120.",
  },
};

function BillingUpgradeView({
  billing,
  onBillingChange,
  onSubscribe,
  busy,
}: {
  billing: Billing;
  onBillingChange: (v: Billing) => void;
  onSubscribe: () => void;
  busy: boolean;
}): React.ReactElement {
  const plan = PRO_PLAN_DATA[billing];
  return (
    <div className="billing-upgrade">
      <BillingToggle value={billing} onChange={onBillingChange} />
      <div className="pricing-card pricing-card--highlight billing-upgrade__card">
        <div className="pricing-card__header">
          <div className="pricing-card__name-row">
            <p className="pricing-card__name">Pro</p>
            <span className="pricing-card__badge pricing-card__badge--best">Most Popular</span>
          </div>
          <p className="pricing-card__description">{plan.description}</p>
        </div>
        <div className="pricing-card__pricing">
          <div className="pricing-card__price-row">
            <span className="pricing-card__currency">$</span>
            <span className="pricing-card__amount">{plan.price}</span>
            <span className="pricing-card__period">/month</span>
          </div>
          <p className="pricing-card__subtext">{plan.subtext}</p>
          <button
            type="button"
            onClick={onSubscribe}
            disabled={busy}
            className="pricing-card__cta pricing-card__cta--primary billing-cta-btn"
            aria-label="Subscribe to Pro"
          >
            {busy ? "Redirecting…" : "Subscribe to Pro"}
          </button>
        </div>
        <div className="pricing-card__features">
          <p className="pricing-card__features-label">Everything in Free, plus:</p>
          {PRO_FEATURES.map((f) => (
            <div key={f.text} className="pricing-card__feature">
              <CheckIcon />
              <span className="pricing-card__feature-text">{f.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function BillingActivePlanView({
  entitlement,
  onPortal,
  busy,
}: {
  entitlement: NonNullable<Entitlement>;
  onPortal: () => void;
  busy: boolean;
}): React.ReactElement {
  const periodEnd = entitlement.current_period_end
    ? new Date(entitlement.current_period_end).toLocaleDateString()
    : null;

  return (
    <div className="billing-active-plan">
      <div className="billing-active-plan__header">
        <span className="billing-active-plan__name">Pro</span>
        <span className="billing-active-plan__badge">Active</span>
      </div>
      {periodEnd && entitlement.cancel_at_period_end && (
        <p className="billing-active-plan__info">
          Cancels {periodEnd}. Access continues until then.
        </p>
      )}
      {periodEnd && !entitlement.cancel_at_period_end && (
        <p className="billing-active-plan__info">Renews {periodEnd}.</p>
      )}
      <button
        type="button"
        onClick={onPortal}
        disabled={busy}
        className="billing-content-btn billing-content-btn-secondary"
        aria-label="Manage billing"
      >
        {busy ? "Redirecting…" : "Manage billing"}
      </button>
    </div>
  );
}

export function BillingContent(): React.ReactElement | null {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [entitlement, setEntitlement] = useState<Entitlement>(null);
  const [billing, setBilling] = useState<Billing>("yearly");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<"checkout" | "portal" | null>(null);

  const redirectToSignIn = useCallback(() => {
    router.replace("/sign-in?redirect=" + encodeURIComponent("/billing"));
  }, [router]);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      const meRes = await apiFetch("/api/me");
      const me = (await meRes.json()) as { user: User | null };
      if (meRes.status === 401 || !me.user) {
        redirectToSignIn();
        return;
      }
      setUser(me.user);

      const entRes = await apiFetch("/api/billing/entitlement");
      if (entRes.status === 401) {
        redirectToSignIn();
        return;
      }
      if (!entRes.ok) {
        setLoadError("Could not load billing.");
        setLoading(false);
        return;
      }
      const ent = (await entRes.json()) as Entitlement;
      setEntitlement(ent);
    } catch {
      setLoadError("Network error.");
    } finally {
      setLoading(false);
    }
  }, [redirectToSignIn]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCheckout(): Promise<void> {
    setActionError(null);
    setActionLoading("checkout");
    try {
      const res = await apiFetch("/api/billing/checkout-session", {
        method: "POST",
        body: JSON.stringify({ plan: "pro", interval: billing }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok) {
        setActionError(data.error ?? "Something went wrong. Please try again later.");
        return;
      }
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      setActionError("No redirect URL received.");
    } catch {
      setActionError("Could not complete request.");
    } finally {
      setActionLoading(null);
    }
  }

  async function handlePortal(): Promise<void> {
    setActionError(null);
    setActionLoading("portal");
    try {
      const res = await apiFetch("/api/billing/portal-session", {
        method: "POST",
        body: JSON.stringify({}),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok) {
        setActionError(data.error ?? "Something went wrong. Please try again later.");
        return;
      }
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      setActionError("No redirect URL received.");
    } catch {
      setActionError("Could not complete request.");
    } finally {
      setActionLoading(null);
    }
  }

  if (loading && !user) {
    return <p className="billing-content-loading">Loading…</p>;
  }

  if (loadError && !user) {
    return <p className="billing-content-error">{loadError}</p>;
  }

  if (!user) {
    return null;
  }

  const activePro = !!(entitlement && entitlement.active && entitlement.plan_code !== "free");
  const busy = actionLoading !== null;

  return (
    <div className="billing-content">
      {loadError && (
        <p className="billing-content-error" role="alert">
          {loadError}
        </p>
      )}

      {activePro ? (
        <BillingActivePlanView
          entitlement={entitlement!}
          onPortal={handlePortal}
          busy={busy}
        />
      ) : (
        <BillingUpgradeView
          billing={billing}
          onBillingChange={setBilling}
          onSubscribe={handleCheckout}
          busy={busy}
        />
      )}

      {actionError && (
        <p className="billing-content-action-error" role="alert">
          {actionError}
        </p>
      )}
    </div>
  );
}
