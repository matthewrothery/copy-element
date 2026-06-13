# Element Armory MCP Server

Remote MCP server for [Element Armory](https://elementarmory.com), backed by your account's captured UI elements. AI coding tools (Cursor, Claude Code, Claude Desktop, etc.) connect to it over HTTP to fetch your captures and convert them into components.

Hosted at `https://mcp.elementarmory.com` — no local install required to use it. The instructions below also cover running the server yourself for development.

## Connecting an AI tool

Open the **MCP Connection** page in the Element Armory extension (`app.html#/mcp`) while signed in — it has copy-paste setup snippets for Cursor, Claude Code, Claude Desktop, and other MCP clients. The general shape:

**Cursor** — add to `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "element-armory": {
      "url": "https://mcp.elementarmory.com",
      "type": "http"
    }
  }
}
```

**Claude Code** — run once:

```bash
claude mcp add element-armory --transport http https://mcp.elementarmory.com
```

**Claude Desktop / other clients** — add `https://mcp.elementarmory.com` as a custom HTTP connector.

In every case, your tool opens a browser to sign in and authorize access — no manual token handling required.

## Authentication

The server is a `StreamableHTTPServerTransport` MCP endpoint protected by OAuth-style Bearer JWTs:

- `GET /.well-known/oauth-protected-resource` — OAuth Protected Resource Metadata (no auth required). Points clients at the main Element Armory server as the authorization server.
- All other requests require `Authorization: Bearer <jwt>`. The JWT is issued by the main server, validated here against `JWT_SECRET` with the expected issuer/audience.
- Missing or invalid tokens return `401` with a `WWW-Authenticate: Bearer` header pointing back at the resource metadata, so MCP clients can drive the OAuth flow automatically.

## MCP tools

Once connected, these tools are available:

### Captures

- **getLatestCapture** — Fetch the most recently captured UI element, including HTML and CSS.
- **getCaptureById** — Fetch a specific capture by ID.
- **listCaptures** — List recent captures with metadata (`id`, `sourceUrl`, `capturedAt`, `status`). Supports `limit` (up to 50) and a `cursor` for pagination.

### Prompts

- **getBasicPrompt** — Format a capture's HTML/CSS as a ready-to-paste AI prompt.
- **getAdvancedPrompt** — Enhanced prompt with element structure analysis and external resource mapping. **Pro plan only.**

### Transform

- **cleanCapture** — Strip scripts, event handlers, and tracking attributes from HTML/CSS.
- **extractComponentStructure** — Parse HTML into a hierarchical element tree.
- **mapExternalResources** — Scan HTML/CSS for external images, fonts, and CDN links.

### Convert

- **convertCapture** — Convert a capture into a component for a target framework (React, Vue, Svelte, Solid, Alpine, Astro, Lit, Preact) and styling approach (Tailwind, CSS Modules, styled-components, inline styles) using AI. Costs **5 quota units**.

## Usage limits

- **Free plan:** 10 quota units/month. Most tools cost 1 unit; `convertCapture` costs 5.
- **Pro plan:** unlimited.

Exceeding the limit returns an error from the tool call; upgrade at the link included in the error message.

## Running locally (development)

```bash
npm install
cp .env.example .env   # set MAIN_SERVER_URL, JWT_SECRET, INTERNAL_API_KEY, ANTHROPIC_API_KEY
npm run dev
```

The server listens on `MCP_PORT` (default `3001`) and validates JWTs issued by `MAIN_SERVER_URL`/`MAIN_SERVER_ISSUER`. For production:

```bash
npm run build
npm start
```

### Environment variables

| Variable | Description |
| --- | --- |
| `MCP_PORT` | Port to listen on (default `3001`) |
| `MAIN_SERVER_URL` | Base URL of the main Element Armory server (default `http://localhost:3000`) |
| `MAIN_SERVER_ISSUER` | Expected JWT issuer (defaults to `MAIN_SERVER_URL`) |
| `MCP_SERVER_URL` | Public URL of this server, used as the JWT audience and resource identifier (default `http://localhost:9950`) |
| `INTERNAL_API_KEY` | Key for internal API calls to the main server |
| `ANTHROPIC_API_KEY` | Used by `convertCapture` for AI-powered conversion |
| `JWT_SECRET` | Shared secret for verifying access tokens |
