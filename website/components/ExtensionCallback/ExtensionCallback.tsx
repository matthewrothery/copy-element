"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import "./ExtensionCallback.css";

export function ExtensionCallback(): React.ReactElement {
  const searchParams = useSearchParams();
  const [message, setMessage] = useState<string>("Connecting extension…");
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const install_id = searchParams.get("install_id");
    const extensionId = searchParams.get("extension_id");

    if (!install_id || !extensionId) {
      setMessage("Missing install_id or extension_id. Close this tab and try again.");
      setFailed(true);
      return;
    }

    void (async () => {
      try {
        // Step 1: link install to authenticated user
        const linkRes = await apiFetch("/api/installs/link", {
          method: "POST",
          body: JSON.stringify({ install_id }),
        });
        if (!linkRes.ok) {
          const data = (await linkRes.json().catch(() => ({}))) as { error?: string };
          throw new Error(data.error ?? "Failed to link install.");
        }

        // Step 2: generate a short-lived auth code for the extension to exchange
        const codeRes = await apiFetch("/api/auth/extension-session/code", {
          method: "POST",
          body: JSON.stringify({ install_id }),
        });
        if (!codeRes.ok) {
          const data = (await codeRes.json().catch(() => ({}))) as { error?: string };
          throw new Error(data.error ?? "Failed to generate auth code.");
        }
        const { code } = (await codeRes.json()) as { code: string };

        // Step 3: redirect to extension auth-callback page
        window.location.href =
          "chrome-extension://" +
          extensionId +
          "/auth-callback.html" +
          "?code=" + encodeURIComponent(code) +
          "&install_id=" + encodeURIComponent(install_id);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "An unexpected error occurred.";
        setMessage(msg);
        setFailed(true);
      }
    })();
  }, [searchParams]);

  return (
    <div className="extension-callback">
      <h1 className="extension-callback-title">Connect extension</h1>
      <p className="extension-callback-status">{message}</p>
      {failed && (
        <button
          type="button"
          className="extension-callback-retry"
          onClick={() => window.close()}
        >
          Close tab
        </button>
      )}
    </div>
  );
}
