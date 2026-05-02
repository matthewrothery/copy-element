import type { JSX } from "react";
import { useState } from "react";
import { MCP_URL } from "../../../shared/mcp-url";

type ToolId = "cursor" | "claudecode" | "other";

const TOOLS: { id: ToolId; label: string }[] = [
  { id: "cursor", label: "Cursor" },
  { id: "claudecode", label: "Claude Code" },
  { id: "other", label: "Other" },
];

function buildSnippet(tool: ToolId): string {
  switch (tool) {
    case "cursor":
      return JSON.stringify(
        {
          mcpServers: {
            "element-armory": {
              url: MCP_URL,
              type: "http",
            },
          },
        },
        null,
        2
      );
    case "claudecode":
      return `claude mcp add element-armory --transport http ${MCP_URL}`;
    case "other":
      return MCP_URL;
  }
}

function buildSnippetLabel(tool: ToolId): string {
  switch (tool) {
    case "cursor":
      return "Add to ~/.cursor/mcp.json";
    case "claudecode":
      return "Run in terminal";
    case "other":
      return "MCP server URL";
  }
}

function buildSetupNote(tool: ToolId): string {
  switch (tool) {
    case "cursor":
      return "After saving, open Cursor → Settings → MCP and verify element-armory appears with a green indicator.";
    case "claudecode":
      return "Run this command once. Claude Code will open a browser to log in automatically.";
    case "other":
      return "Add this URL as an HTTP MCP endpoint. Your tool will open a browser to log in.";
  }
}

export function McpConnect(): JSX.Element {
  const [selectedTool, setSelectedTool] = useState<ToolId>("cursor");
  const [copied, setCopied] = useState(false);

  const toolIndex = TOOLS.findIndex((t) => t.id === selectedTool);
  const indicatorOffset = (toolIndex / TOOLS.length) * 100;

  async function handleCopy(): Promise<void> {
    const snippet = buildSnippet(selectedTool);
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
        <div className="mcp-config-block">
          <pre className="mcp-config-pre" aria-label="MCP config snippet">
            <code>{buildSnippet(selectedTool)}</code>
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
      </div>
    </div>
  );
}
