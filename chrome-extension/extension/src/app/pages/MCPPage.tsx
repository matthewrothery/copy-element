import type { JSX } from "react";
import { useEffect, useState } from "react";
import { getAuthState } from "../../shared/storage/auth-storage";
import { getMcpApiKey } from "../../shared/storage/mcp-storage";
import { generateMcpToken, getMcpTokenMeta, rotateMcpToken } from "../../popup/api";
import type { McpTokenMetaPayload } from "../../shared/types/messages";
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

type PageState =
  | { kind: "loading" }
  | { kind: "signed-out" }
  | { kind: "ready"; apiKey: string | null; meta: McpTokenMetaPayload; keyMissing: boolean };

export function MCPPage(): JSX.Element {
  const [state, setState] = useState<PageState>({ kind: "loading" });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    void load();
  }, []);

  async function load(): Promise<void> {
    setState({ kind: "loading" });
    try {
      const auth = await getAuthState();
      if (!auth.signed_in) {
        setState({ kind: "signed-out" });
        return;
      }

      const [apiKey, meta] = await Promise.all([
        getMcpApiKey(),
        getMcpTokenMeta().catch(() => null),
      ]);

      const resolvedMeta: McpTokenMetaPayload = meta ?? {
        exists: false,
        created_at: null,
        last_used_at: null,
      };

      // Key missing but token exists on server
      const keyMissing = apiKey === null && resolvedMeta.exists;

      setState({ kind: "ready", apiKey, meta: resolvedMeta, keyMissing });
    } catch {
      setState({ kind: "signed-out" });
    }
  }

  async function handleGenerate(): Promise<void> {
    setIsLoading(true);
    try {
      const result = await generateMcpToken();
      const meta = await getMcpTokenMeta().catch(() => ({
        exists: true,
        created_at: Date.now(),
        last_used_at: null,
      }));
      setState({ kind: "ready", apiKey: result.api_key, meta, keyMissing: false });
    } catch {
      // Keep current state; user can retry
    } finally {
      setIsLoading(false);
    }
  }

  async function handleRotate(): Promise<void> {
    setIsLoading(true);
    try {
      const result = await rotateMcpToken();
      const meta = await getMcpTokenMeta().catch(() => ({
        exists: true,
        created_at: Date.now(),
        last_used_at: null,
      }));
      setState({ kind: "ready", apiKey: result.api_key, meta, keyMissing: false });
    } catch {
      // Keep current state; user can retry
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="app-page">
      <header className="app-page-header">
        <h1 className="app-page-title">MCP Connection</h1>
        <p className="app-page-subtitle">
          Connect AI coding tools to your Element Armory captures via the Model Context Protocol.
        </p>
      </header>

      {state.kind === "loading" && (
        <div className="mcp-loading" aria-label="Loading">
          <span className="mcp-spinner" aria-hidden="true" />
        </div>
      )}

      {state.kind === "signed-out" && <McpSignedOut />}

      {state.kind === "ready" && state.keyMissing && (
        <div className="mcp-url-missing">
          <p className="app-page-text">
            A token exists on the server but the API key was not saved locally.
            Rotate to generate a new key.
          </p>
          <button
            className="mcp-cta-btn"
            onClick={() => void handleRotate()}
            disabled={isLoading}
          >
            {isLoading ? "Rotating…" : "Rotate to reveal new key"}
          </button>
        </div>
      )}

      {state.kind === "ready" && !state.keyMissing && (
        <>
          <McpConnect
            apiKey={state.apiKey}
            meta={state.meta}
            onGenerate={() => void handleGenerate()}
            onRotate={() => void handleRotate()}
            isLoading={isLoading}
          />

          {state.apiKey && (
            <div className="mcp-status-row">
              <span className="mcp-status-dot" aria-hidden="true" />
              <span className="mcp-status-label">
                {state.meta.last_used_at !== null
                  ? "Token active · verified by recent tool call"
                  : "Token active · not yet used by an AI tool"}
              </span>
            </div>
          )}

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
