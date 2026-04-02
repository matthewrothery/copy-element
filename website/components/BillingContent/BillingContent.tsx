"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import "./BillingContent.css";

type User = { id: string; name?: string | null; email?: string | null; image?: string | null };
type Entitlement = {
  plan_code: string;
  status: string;
  active: boolean;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
} | null;

export function BillingContent(): React.ReactElement | null {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [entitlement, setEntitlement] = useState<Entitlement>(null);
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
        setEntitlement(null);
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
        body: JSON.stringify({ plan: "pro" }),
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

  const busy = actionLoading !== null;

  return (
    <div className="billing-content">
      {entitlement !== null && (
        <p className="billing-content-plan">
          Plan: {entitlement.plan_code}
          {entitlement.active ? " (active)" : ""}
          {entitlement.cancel_at_period_end ? "- cancels at period end" : ""}
          {entitlement.current_period_end && entitlement.active
            ? `- renews ${new Date(entitlement.current_period_end).toLocaleDateString()}`
            : ""}
        </p>
      )}

      <div className="billing-content-actions">
        <button
          type="button"
          onClick={handleCheckout}
          disabled={busy}
          className="billing-content-btn billing-content-btn-primary"
          aria-label="Upgrade subscription"
        >
          {actionLoading === "checkout" ? "Redirecting…" : "Upgrade"}
        </button>
        <button
          type="button"
          onClick={handlePortal}
          disabled={busy}
          className="billing-content-btn billing-content-btn-secondary"
          aria-label="Manage billing"
        >
          {actionLoading === "portal" ? "Redirecting…" : "Manage billing"}
        </button>
      </div>

      {actionError && (
        <p className="billing-content-action-error" role="alert">
          {actionError}
        </p>
      )}
    </div>
  );
}
