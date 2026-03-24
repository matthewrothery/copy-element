#!/usr/bin/env node
import http from 'node:http';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { config } from './config.js';
import { validateUserCode } from './auth.js';
import { registerCaptureTools } from './tools/captures.js';
import { registerPromptTools } from './tools/prompts.js';
import { registerTransformTools } from './tools/transform.js';
import { registerAiConvertTools } from './tools/ai-convert.js';
const API_KEY_PATTERN = /^[A-Za-z0-9_-]{24}$/;
function sendError(res, status, message) {
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: message }));
}
function log(method, path, status, ms, extra) {
    const suffix = extra ? ` — ${extra}` : '';
    console.log(`[MCP] ${method} ${path} → ${status} (${ms}ms)${suffix}`);
}
async function handleMcpRequest(userCode, req, res, body) {
    const user = await validateUserCode(userCode);
    if (!user) {
        console.warn(`[MCP] Auth failed for key ${userCode.slice(0, 4)}… (hash not recognised by main server)`);
        sendError(res, 401, 'Invalid or expired MCP token');
        return;
    }
    console.log(`[MCP] Auth OK — userId=${user.userId} plan=${user.planCode} calls=${user.callCount} limitReached=${user.limitReached}`);
    const server = new McpServer({ name: 'element-armory-mcp', version: '1.0.0' });
    registerCaptureTools(server, user);
    registerPromptTools(server, user);
    registerTransformTools(server, user);
    registerAiConvertTools(server, user);
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
    await server.connect(transport);
    await transport.handleRequest(req, res, body);
}
const httpServer = http.createServer((req, res) => {
    const startMs = Date.now();
    const method = req.method ?? 'UNKNOWN';
    const path = req.url ?? '';
    console.log(`[MCP] → ${method} ${path}`);
    if (path !== '/mcp') {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not found. Use /mcp with Authorization: Bearer <api-key>' }));
        log(method, path, 404, Date.now() - startMs);
        return;
    }
    // Accept key from custom header (preferred) or Authorization: Bearer (legacy)
    const customHeader = req.headers['element_armory_api_key'] ?? req.headers['element-armory-api-key'] ?? '';
    const authHeader = req.headers['authorization'] ?? '';
    const apiKey = customHeader.trim() || authHeader.replace(/^Bearer\s+/i, '');
    if (!API_KEY_PATTERN.test(apiKey)) {
        sendError(res, 401, 'Missing or invalid API key. Set the ELEMENT_ARMORY_API_KEY header.');
        log(method, path, 401, Date.now() - startMs);
        return;
    }
    // Intercept and proxy the response status for logging
    const origWriteHead = res.writeHead.bind(res);
    let loggedStatus = 0;
    res.writeHead = ((...args) => {
        loggedStatus = typeof args[0] === 'number' ? args[0] : 0;
        return origWriteHead(...args);
    });
    res.on('finish', () => {
        log(method, path, loggedStatus || res.statusCode, Date.now() - startMs);
    });
    if (method === 'GET' || method === 'DELETE') {
        // GET: SSE stream for server→client messages; DELETE: session termination.
        // Pass directly to the transport — it will respond appropriately.
        handleMcpRequest(apiKey, req, res, undefined).catch((err) => {
            console.error('[MCP] Error handling GET/DELETE:', err);
            if (!res.headersSent)
                sendError(res, 500, 'Internal server error');
        });
        return;
    }
    if (method !== 'POST') {
        sendError(res, 405, 'Method not allowed');
        return;
    }
    let rawBody = '';
    req.setEncoding('utf8');
    req.on('data', (chunk) => { rawBody += chunk; });
    req.on('end', () => {
        let body;
        try {
            body = JSON.parse(rawBody);
        }
        catch {
            sendError(res, 400, 'Invalid JSON body');
            return;
        }
        const rpcMethod = body?.method ?? '(unknown)';
        console.log(`[MCP] POST ${path} rpc=${rpcMethod}`);
        handleMcpRequest(apiKey, req, res, body).catch((err) => {
            console.error('[MCP] Request error:', err);
            if (!res.headersSent)
                sendError(res, 500, 'Internal server error');
        });
    });
    req.on('error', (err) => {
        console.error('[MCP] Request stream error:', err);
        if (!res.headersSent)
            sendError(res, 500, 'Request error');
    });
});
httpServer.listen(config.MCP_PORT, () => {
    console.log(`[MCP] Element Armory MCP server running on port ${config.MCP_PORT}`);
    console.log(`[MCP] Main server: ${config.MAIN_SERVER_URL}`);
});
httpServer.on('error', (err) => {
    console.error('[MCP] HTTP server error:', err);
    process.exit(1);
});
