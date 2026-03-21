import type { JSX } from "react";
import { useState } from "react";
import type { McpTokenMetaPayload } from "../../../shared/types/messages";
import { MCP_URL } from "../../../shared/mcp-url";

const MCP_ENDPOINT = `${MCP_URL}/mcp`;

type ToolId = "cursor" | "claudecode" | "codex" | "other";

const TOOLS: { id: ToolId; label: string }[] = [
  { id: "cursor", label: "Cursor" },
  { id: "claudecode", label: "Claude Code" },
  { id: "codex", label: "Codex" },
  { id: "other", label: "Other" },
];

function buildSnippet(tool: ToolId, apiKey: string): string {
  switch (tool) {
    case "cursor":
      return JSON.stringify(
        {
          mcpServers: {
            "element-armory": {
              url: MCP_ENDPOINT,
              headers: { ELEMENT_ARMORY_API_KEY: apiKey },
            },
          },
        },
        null,
        2
      );
    case "claudecode":
      return `claude mcp add element-armory --transport http-first \\\n  --header "ELEMENT_ARMORY_API_KEY: ${apiKey}" \\\n  ${MCP_ENDPOINT}`;
    case "codex":
      return JSON.stringify(
        {
          mcpServers: {
            "element-armory": {
              url: MCP_ENDPOINT,
              headers: { ELEMENT_ARMORY_API_KEY: apiKey },
            },
          },
        },
        null,
        2
      );
    case "other":
      return `URL: ${MCP_ENDPOINT}\nHeader: ELEMENT_ARMORY_API_KEY: ${apiKey}`;
  }
}

function buildSnippetLabel(tool: ToolId): string {
  switch (tool) {
    case "cursor":
      return "Add to ~/.cursor/mcp.json";
    case "claudecode":
      return "Run in terminal";
    case "codex":
      return "Add to ~/.codex/config.json";
    case "other":
      return "HTTP MCP endpoint";
  }
}

function buildSetupNote(tool: ToolId): string {
  switch (tool) {
    case "cursor":
      return "After saving, open Cursor → Settings → MCP and verify element-armory appears with a green indicator.";
    case "claudecode":
      return "Run this command once. Claude Code will connect automatically on next use.";
    case "codex":
      return "After saving, restart Codex. The element-armory server will appear in your MCP list.";
    case "other":
      return "Configure this as an HTTP MCP endpoint in your tool. Keep your API key private.";
  }
}

function formatRelativeTime(epochMs: number | null): string {
  if (epochMs === null) return "never";
  const diffMs = Date.now() - epochMs;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "today";
  if (diffDays === 1) return "1 day ago";
  return `${diffDays} days ago`;
}

interface McpConnectProps {
  apiKey: string | null;
  meta: McpTokenMetaPayload;
  onGenerate: () => void;
  onRotate: () => void;
  isLoading: boolean;
}

export function McpConnect({ apiKey, meta, onGenerate, onRotate, isLoading }: McpConnectProps): JSX.Element {
  const [selectedTool, setSelectedTool] = useState<ToolId>("cursor");
  const [copied, setCopied] = useState(false);
  const [confirmRotate, setConfirmRotate] = useState(false);

  const toolIndex = TOOLS.findIndex((t) => t.id === selectedTool);
  const indicatorOffset = (toolIndex / TOOLS.length) * 100;

  async function handleCopy(): Promise<void> {
    if (!apiKey) return;
    const snippet = buildSnippet(selectedTool, apiKey);
    await navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="mcp-connect">
      <div className="mcp-tool-picker" role="tablist" aria-label="AI tool">
        <div
          className="mcp-tool-indicator"
          style={{
            width: `${100 / TOOLS.length}%`,
            transform: `translateX(${indicatorOffset * TOOLS.length}%)`,
          }}
        >
          <div className="mcp-tool-indicator-inner" />
        </div>
        {TOOLS.map((tool) => (
          <button
            key={tool.id}
            role="tab"
            aria-selected={selectedTool === tool.id}
            className={`mcp-tool-tab${selectedTool === tool.id ? " mcp-tool-tab--active" : ""}`}
            onClick={() => setSelectedTool(tool.id)}
          >
            {tool.label}
          </button>
        ))}
      </div>

      <div className="mcp-config-section">
        <div className="mcp-config-label">{buildSnippetLabel(selectedTool)}</div>
        {apiKey ? (
          <>
            <div className="mcp-config-block">
              <pre className="mcp-config-pre" aria-label="MCP config snippet">
                <code>{buildSnippet(selectedTool, apiKey)}</code>
              </pre>
              <button
                className="mcp-copy-btn"
                onClick={() => void handleCopy()}
                aria-label="Copy to clipboard"
                title="Copy to clipboard"
              >
                {copied ? "✓" : "⎘"}
              </button>
            </div>
            <p className="mcp-setup-note">{buildSetupNote(selectedTool)}</p>
          </>
        ) : (
          <div className="mcp-generate-cta">
            <p className="mcp-generate-desc">Generate your API key to get started.</p>
            <button
              className="mcp-cta-btn"
              onClick={onGenerate}
              disabled={isLoading}
              aria-label="Generate API key"
            >
              {isLoading ? "Generating…" : "Generate connection"}
            </button>
          </div>
        )}
      </div>

      {apiKey && (
        <div className="mcp-token-meta">
          <span className="mcp-token-meta-info">
            {meta.created_at !== null
              ? `Created ${formatRelativeTime(meta.created_at)}`
              : "Token active"}
            {meta.last_used_at !== null && ` · Last used ${formatRelativeTime(meta.last_used_at)}`}
          </span>
          {confirmRotate ? (
            <span className="mcp-rotate-confirm">
              <span className="mcp-rotate-confirm-label">Invalidates existing config. Continue?</span>
              <button
                className="mcp-rotate-btn mcp-rotate-btn--danger"
                onClick={() => { setConfirmRotate(false); onRotate(); }}
                disabled={isLoading}
                aria-label="Confirm rotate MCP token"
              >
                Yes, rotate
              </button>
              <button
                className="mcp-rotate-btn"
                onClick={() => setConfirmRotate(false)}
                aria-label="Cancel rotate"
              >
                Cancel
              </button>
            </span>
          ) : (
            <button
              className="mcp-rotate-btn"
              onClick={() => setConfirmRotate(true)}
              disabled={isLoading}
              aria-label="Rotate MCP token"
            >
              {isLoading ? "Rotating…" : "Rotate"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
