"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import "./ExtensionCallback.css";

export function ExtensionCallback(): React.ReactElement {
  const searchParams = useSearchParams();
  const [message, setMessage] = useState<string>("Passing code to extension…");

  useEffect(() => {
    const code = searchParams.get("code");
    const install_id = searchParams.get("install_id");
    const extensionId = searchParams.get("extension_id") ?? "";

    if (!code || !install_id) {
      setMessage("Missing code or install_id. Close this tab.");
      return;
    }

    try {
      if (extensionId) {
        window.location.href =
          "chrome-extension://" +
          extensionId +
          "/?code=" +
          encodeURIComponent(code) +
          "&install_id=" +
          encodeURIComponent(install_id);
        return;
      }
      setMessage(
        "Code: " + code + " (add extension_id to URL for redirect). You can close this tab."
      );
    } catch {
      setMessage("Could not redirect. Copy the code from the URL and paste it in the extension.");
    }
  }, [searchParams]);

  return (
    <div className="extension-callback">
      <h1 className="extension-callback-title">Connect extension</h1>
      <p className="extension-callback-status">{message}</p>
    </div>
  );
}
