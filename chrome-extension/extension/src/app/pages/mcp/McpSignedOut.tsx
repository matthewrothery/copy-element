import type { JSX } from "react";
import { useEffect, useState } from "react";
import { getInstallIdFromBackground, openSignInPage } from "../../../popup/api";

const FEATURES = [
  {
    icon: "◈",
    title: "Access your captures",
    description: "AI tools can browse and retrieve every element you capture.",
  },
  {
    icon: "⟳",
    title: "Convert to any framework",
    description: "Translate captures to React, Vue, Svelte, and more with AI.",
  },
  {
    icon: "✦",
    title: "Chat-ready prompts",
    description: "Format captures instantly for AI chat.",
  },
];

export function McpSignedOut(): JSX.Element {
  const [installId, setInstallId] = useState<string | null>(null);

  useEffect(() => {
    getInstallIdFromBackground()
      .then(setInstallId)
      .catch(() => setInstallId(null));
  }, []);

  function handleSignIn(): void {
    if (installId) {
      openSignInPage(installId);
    }
  }

  return (
    <div className="mcp-signed-out">
      <div className="mcp-feature-grid">
        {FEATURES.map(({ icon, title, description }) => (
          <div key={title} className="mcp-feature-card">
            <div className="mcp-feature-icon" aria-hidden="true">{icon}</div>
            <div className="mcp-feature-card-title">{title}</div>
            <div className="mcp-feature-card-desc">{description}</div>
          </div>
        ))}
      </div>
      <div className="mcp-signed-out-cta">
        <button
          className="mcp-cta-btn"
          onClick={handleSignIn}
          disabled={!installId}
          aria-label="Sign in to connect MCP"
        >
          Sign in to connect
        </button>
      </div>
    </div>
  );
}
