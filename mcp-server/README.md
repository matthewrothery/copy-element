# Element Armory MCP Server

Standalone local MCP server for Element Armory snippet access. Runs over stdio for use with Cursor, Claude Code, or other MCP clients. No deployment or hosting—run it locally when you need it.

## Run locally

```bash
npm install
npm start
```

Or from another directory:

```bash
npx snappymcp-host
```

## Snippet data

Snippets are stored at `~/.snappymcp/snippets.json`. The file may be empty until you add a way to sync or import snippets (e.g. a future CLI or extension feature). The Chrome extension’s **Copy MCP** button is the main way to get snippet content into your AI chat; running this server is optional and for future use with MCP tools.

## MCP tools

When connected via stdio, the server exposes:

- **list_snippets** – List all snippets (id, title, sourceUrl, dimensions).
- **get_snippet** – Get full snippet by ID (html, jsx, styleBlock, etc.).
- **get_snippet_prompt** – Get a formatted prompt for a snippet.

## Configuring Cursor / Claude Code

Add the server to your MCP config (e.g. Cursor settings) with a command that runs this package:

```json
{
  "mcpServers": {
    "snappymcp": {
      "command": "node",
      "args": ["/path/to/mcp-server/dist/index.js"]
    }
  }
}
```

Or use `npx`:

```json
{
  "mcpServers": {
    "snappymcp": {
      "command": "npx",
      "args": ["snappymcp-host"]
    }
  }
}
```

Replace `/path/to/mcp-server` with the actual path to this package, or run from the package directory.
