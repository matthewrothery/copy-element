import type { JSX } from "react";
import { useAuthState } from "../shared/hooks/useAuthState";
import { useCaptureSyncStatus } from "../shared/hooks/useCaptureSyncStatus";
import { McpSignedOut } from "./mcp/McpSignedOut";
import { McpConnect } from "./mcp/McpConnect";

const TOOLS: { category: string; items: { name: string; description: string; note?: string }[] }[] = [
  {
    category: "Captures",
    items: [
      { name: "getLatestCapture", description: "Fetch the most recently captured UI element including HTML and CSS." },
      { name: "getCaptureById", description: "Fetch a specific capture by its ID." },
      { name: "listCaptures", description: "List recent captures with metadata. Supports pagination (limit up to 50)." },
    ],
  },
  {
    category: "Prompts",
    items: [
      { name: "getBasicPrompt", description: "Format a capture as a ready-to-paste AI chat prompt." },
      { name: "getAdvancedPrompt", description: "Enhanced prompt with element structure and resource mapping.", note: "Pro" },
    ],
  },
  {
    category: "Transform",
    items: [
      { name: "cleanCapture", description: "Strip scripts, event handlers, and tracking attributes." },
      { name: "extractComponentStructure", description: "Parse HTML into a hierarchical element tree." },
      { name: "mapExternalResources", description: "Scan HTML/CSS for external images, fonts, and CDN links." },
    ],
  },
  {
    category: "Convert",
    items: [
      {
        name: "convertCapture",
        description: "Convert a capture to React, Vue, Svelte, Solid, Alpine, Astro, Lit, or Preact with AI. Supports Tailwind, CSS Modules, styled-components, inline styles.",
        note: "5 quota units",
      },
    ],
  },
];

export function MCPPage(): JSX.Element {
  const { signedIn, loading } = useAuthState();
  const state = loading ? "loading" : signedIn ? "ready" : "signed-out";
  const syncStatus = useCaptureSyncStatus();

  return (
    <div className="app-page">
      <header className="app-page-header">
        <h1 className="app-page-title">MCP Connection</h1>
        <p className="app-page-subtitle">
          Connect AI coding tools to your Element Armory captures via the Model Context Protocol.
        </p>
      </header>

      {state === "loading" && (
        <div className="mcp-loading" aria-label="Loading">
          <span className="mcp-spinner" aria-hidden="true" />
        </div>
      )}

      {state === "signed-out" && <McpSignedOut />}

      {state === "ready" && (
        <>
          {syncStatus.phase && (
            <div className="mcp-sync-status" role="status" aria-live="polite" aria-atomic="true">
              {syncStatus.phase === "start" && (
                <span className="mcp-spinner mcp-spinner--inline" aria-hidden="true" />
              )}
              <span>{syncStatus.message}</span>
            </div>
          )}

          <McpConnect />

          <section className="app-page-section mcp-tools-section" aria-labelledby="mcp-tools-heading">
            <h2 id="mcp-tools-heading" className="app-page-heading">Available tools</h2>
            <p className="app-page-text mcp-tools-intro">
              Once connected, your AI tool can call these MCP tools to access your captures.
            </p>
            {TOOLS.map(({ category, items }) => (
              <div key={category} className="mcp-tool-group">
                <h3 className="mcp-tool-category">{category}</h3>
                <ul className="app-page-list app-page-list--unstyled">
                  {items.map(({ name, description, note }) => (
                    <li key={name} className="mcp-tool-item">
                      <span className="mcp-tool-name">
                        <code className="app-page-code">{name}</code>
                        {note && <span className="mcp-tool-badge">{note}</span>}
                      </span>
                      <span className="mcp-tool-desc">{description}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <p className="app-page-text">
              Free accounts include <strong>50 quota units/month</strong>. Most tools cost 1 unit.{" "}
              <code className="app-page-code">convertCapture</code> costs 5 units.
            </p>
          </section>
        </>
      )}
    </div>
  );
}
