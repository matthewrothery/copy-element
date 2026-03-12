#!/usr/bin/env node
import { runMcpServer } from "./mcp-server.js";
runMcpServer().catch((err) => {
    console.error("MCP server error:", err.message);
    process.exit(1);
});
