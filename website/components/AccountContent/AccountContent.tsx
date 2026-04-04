"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import "./AccountContent.css";

type User = { id: string; name?: string | null; email?: string | null; image?: string | null };
type Install = { install_id: string; created_at?: number; last_seen_at?: number; extension_version?: string | null; chrome_version?: string | null; os_family?: string | null };

function relativeDate(epochMs: number): string {
  const diff = Date.now() - epochMs;
  const mins = Math.floor(diff / 60000);
  if (mins < 2) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "yesterday";
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months === 1 ? "1 month" : `${months} months`} ago`;
  const years = Math.floor(months / 12);
  return `${years === 1 ? "1 year" : `${years} years`} ago`;
}

function installLabel(inst: Install): string {
  const parts: string[] = [];
  if (inst.os_family) parts.push(inst.os_family);
  if (inst.chrome_version) parts.push(`Chrome ${inst.chrome_version}`);
  if (inst.extension_version) parts.push(`v${inst.extension_version}`);
  const seen = inst.last_seen_at ? `last seen ${relativeDate(inst.last_seen_at)}` : null;
  if (parts.length > 0) return seen ? `${parts.join(" · ")} · ${seen}` : parts.join(" · ");
  return seen ?? inst.install_id;
}
type Entitlement = { plan_code: string; active: boolean } | null;

export function AccountContent(): React.ReactElement | null {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [installs, setInstalls] = useState<Install[]>([]);
  const [entitlement, setEntitlement] = useState<Entitlement>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const redirectToSignIn = useCallback(() => {
    router.replace("/sign-in?redirect=" + encodeURIComponent("/account"));
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

      const instRes = await apiFetch("/api/installs");
      if (!instRes.ok) {
        setInstalls([]);
        setLoadError("Failed to load installs.");
        setLoading(false);
        return;
      }
      const data = (await instRes.json()) as { installs?: Install[] };
      setInstalls(data.installs ?? []);

      const entRes = await apiFetch("/api/billing/entitlement");
      if (entRes.ok) {
        const ent = (await entRes.json()) as { plan_code?: string; active?: boolean };
        setEntitlement({
          plan_code: ent.plan_code ?? "free",
          active: Boolean(ent.active),
        });
      } else {
        setEntitlement(null);
      }
    } catch {
      setLoadError("Network error.");
    } finally {
      setLoading(false);
    }
  }, [redirectToSignIn]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleUnlink(install_id: string): Promise<void> {
    try {
      const res = await apiFetch("/api/installs/unlink", {
        method: "POST",
        body: JSON.stringify({ install_id }),
      });
      if (res.ok) await load();
    } catch {
      setLoadError("Failed to unlink.");
    }
  }

  if (loading && !user) {
    return <p className="account-content-loading">Loading…</p>;
  }

  if (loadError && !user) {
    return <p className="account-content-error">{loadError}</p>;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="account-content">
      <p className="account-content-user">{user.email ?? ""}</p>
      <p>
        <Link href="/billing" className="account-content-link">
          Billing
        </Link>
        {entitlement !== null && (
          <span className="account-content-muted">
            {" "}
           - Plan: {entitlement.plan_code}
            {entitlement.active ? " (active)" : ""}
          </span>
        )}
      </p>

      <section aria-labelledby="account-installs-heading">
        <h2 id="account-installs-heading" className="account-content-section-title">
          Linked installs
        </h2>
        <ul className="account-content-installs-list">
          {installs.length === 0 ? (
            <li className="account-content-muted">No linked installs.</li>
          ) : (
            installs.map((inst) => (
              <li key={inst.install_id} className="account-content-install-item">
                <span className="account-content-install-id">{installLabel(inst)}</span>
                <button
                  type="button"
                  onClick={() => handleUnlink(inst.install_id)}
                  className="account-content-unlink"
                  aria-label={`Unlink install ${installLabel(inst)}`}
                >
                  Unlink
                </button>
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}
