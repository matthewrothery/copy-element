"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getApiUrl, apiFetch } from "@/lib/api";
import "./AccountContent.css";

type User = { id: string; name?: string | null; email?: string | null; image?: string | null };
type Install = { install_id: string; created_at?: string; last_seen_at?: string; extension_version?: string };

export function AccountContent(): React.ReactElement | null {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [installs, setInstalls] = useState<Install[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [installIdInput, setInstallIdInput] = useState("");
  const [codeResult, setCodeResult] = useState<{ type: "link" | "error"; text: string; callbackHref?: string } | null>(null);
  const [codeSubmitting, setCodeSubmitting] = useState(false);

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
    } catch {
      setLoadError("Network error.");
    } finally {
      setLoading(false);
    }
  }, [redirectToSignIn]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleGetCode(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    const install_id = installIdInput.trim();
    if (!install_id) return;
    setCodeResult(null);
    setCodeSubmitting(true);
    try {
      const res = await apiFetch("/api/auth/extension-session/code", {
        method: "POST",
        body: JSON.stringify({ install_id }),
      });
      const data = (await res.json()) as { code?: string; error?: string };
      if (!res.ok) {
        setCodeResult({ type: "error", text: data.error ?? "Failed to get code." });
        return;
      }
      const params = new URLSearchParams({ code: data.code ?? "", install_id });
      setCodeResult({
        type: "link",
        text: "Code created. Open callback page to pass code to extension.",
        callbackHref: "/auth/extension-callback?" + params.toString(),
      });
    } catch {
      setCodeResult({ type: "error", text: "Network error." });
    } finally {
      setCodeSubmitting(false);
    }
  }

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
        </Link>{" "}
        (coming in Phase 3)
      </p>

      <section aria-labelledby="account-connect-heading">
        <h2 id="account-connect-heading" className="account-content-section-title">
          Connect extension
        </h2>
        <p className="account-content-muted">
          Get a one-time code to connect the extension to this account.
        </p>
        <form onSubmit={handleGetCode} className="account-content-code-form">
          <input
            type="text"
            placeholder="Install ID (from extension)"
            value={installIdInput}
            onChange={(e) => setInstallIdInput(e.target.value)}
            disabled={codeSubmitting}
            className="account-content-input"
            aria-label="Install ID from extension"
          />
          <button
            type="submit"
            disabled={codeSubmitting}
            className="account-content-get-code"
            aria-label="Get one-time code"
          >
            {codeSubmitting ? "Getting code…" : "Get code"}
          </button>
        </form>
        {codeResult && (
          <p className="account-content-code-result" role="alert">
            {codeResult.type === "link" && codeResult.callbackHref ? (
              <>
                Code created.{" "}
                <Link href={codeResult.callbackHref}>Open callback page</Link> to pass code to
                extension.
              </>
            ) : (
              codeResult.text
            )}
          </p>
        )}
      </section>

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
                <span className="account-content-install-id">{inst.install_id}</span>
                <span className="account-content-install-meta">
                  {inst.extension_version ?? ""}
                </span>
                <button
                  type="button"
                  onClick={() => handleUnlink(inst.install_id)}
                  className="account-content-unlink"
                  aria-label={`Unlink install ${inst.install_id}`}
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
