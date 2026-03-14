import type { JSX } from "react";

const CURSOR_CONFIG_SNIPPET = `{
  "mcpServers": {
    "snappymcp": {
      "command": "npx",
      "args": ["snappymcp-host"]
    }
  }
}`;

export function MCPPage(): JSX.Element {
  return (
    <div className="app-page">
      <header className="app-page-header">
        <h1 className="app-page-title">MCP</h1>
        <p className="app-page-subtitle">
          Use the Element Armory MCP server to give AI tools (like Cursor) access to your saved snippets.
        </p>
      </header>

      <section className="app-page-section" aria-labelledby="mcp-what">
        <h2 id="mcp-what" className="app-page-heading">What is it?</h2>
        <p className="app-page-text">
          The MCP server runs locally on your machine and talks to Cursor over stdio. It exposes tools such as{" "}
          <strong>list_snippets</strong>, <strong>get_snippet</strong>, and <strong>get_snippet_prompt</strong> so AI
          assistants can read and reuse your captured UI components.
        </p>
      </section>

      <section className="app-page-section" aria-labelledby="mcp-online">
        <h2 id="mcp-online" className="app-page-heading">Is it online?</h2>
        <p className="app-page-text">
          No. The MCP server is not a hosted service. It runs on your computer and communicates with Cursor via stdio.
          There is no cloud or external server involved.
        </p>
      </section>

      <section className="app-page-section" aria-labelledby="mcp-setup">
        <h2 id="mcp-setup" className="app-page-heading">How to set it up</h2>
        <ol className="app-page-list">
          <li>Install and run the server (from the mcp-server package): <code className="app-page-code">npm install</code> then <code className="app-page-code">npm start</code>, or use <code className="app-page-code">npx snappymcp-host</code> from any directory.</li>
          <li>Add it to your Cursor MCP config (e.g. Cursor settings → MCP) with a command that runs the server.</li>
        </ol>
        <p className="app-page-text">Example Cursor MCP config:</p>
        <pre className="app-page-pre" aria-label="Cursor MCP config example">
          <code>{CURSOR_CONFIG_SNIPPET}</code>
        </pre>
        <p className="app-page-text">
          Replace the path or use <code className="app-page-code">npx snappymcp-host</code> as above. Snippet data is
          stored at <code className="app-page-code">~/.snappymcp/snippets.json</code>; the extension’s Copy MCP flow
          is the main way to get content into your AI chat. Running the server is optional and for MCP tool integration.
        </p>
      </section>
    </div>
  );
}
