#!/usr/bin/env node
import http from 'node:http';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { config } from './config.js';
import { validateJwt } from './auth.js';
import { registerCaptureTools } from './tools/captures.js';
import { registerPromptTools } from './tools/prompts.js';
import { registerTransformTools } from './tools/transform.js';
import { registerAiConvertTools } from './tools/ai-convert.js';

const PRM_PATH = '/.well-known/oauth-protected-resource';

function sendJson(res: http.ServerResponse, status: number, body: unknown): void {
  const data = JSON.stringify(body);
  res.writeHead(status, { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) });
  res.end(data);
}

function log(method: string, path: string, status: number, ms: number, extra?: string): void {
  const suffix = extra ? ` — ${extra}` : '';
  console.log(`[MCP] ${method} ${path} → ${status} (${ms}ms)${suffix}`);
}

async function handleMcpRequest(
  token: string,
  req: http.IncomingMessage,
  res: http.ServerResponse,
  body: unknown
): Promise<void> {
  const user = await validateJwt(token);
  if (!user) {
    console.warn('[MCP] Auth failed — JWT invalid or expired');
    res.writeHead(401, {
      'Content-Type': 'application/json',
      'WWW-Authenticate': `Bearer realm="mcp", resource_metadata="${config.MCP_SERVER_URL}${PRM_PATH}"`,
    });
    res.end(JSON.stringify({ error: 'Invalid or expired access token' }));
    return;
  }

  console.log(`[MCP] Auth OK — userId=${user.userId} plan=${user.planCode}`);

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

  // OAuth Protected Resource Metadata — no auth required
  if (method === 'GET' && path === PRM_PATH) {
    sendJson(res, 200, {
      resource: config.MCP_SERVER_URL,
      authorization_servers: [config.MAIN_SERVER_ISSUER],
      scopes_supported: ['mcp:tools'],
      resource_name: 'Element Armory MCP',
    });
    log(method, path, 200, Date.now() - startMs);
    return;
  }

  if (path !== '/') {
    sendJson(res, 404, { error: 'Not found' });
    log(method, path, 404, Date.now() - startMs);
    return;
  }

  // Extract Bearer token from Authorization header
  const authHeader = (req.headers['authorization'] as string | undefined) ?? '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();

  if (!token) {
    res.writeHead(401, {
      'Content-Type': 'application/json',
      'WWW-Authenticate': `Bearer realm="mcp", resource_metadata="${config.MCP_SERVER_URL}${PRM_PATH}"`,
    });
    res.end(JSON.stringify({ error: 'Authorization required' }));
    log(method, path, 401, Date.now() - startMs);
    return;
  }

  // Intercept response status for logging
  const origWriteHead = res.writeHead.bind(res) as typeof res.writeHead;
  let loggedStatus = 0;
  res.writeHead = ((...args: Parameters<typeof res.writeHead>) => {
    loggedStatus = typeof args[0] === 'number' ? args[0] : 0;
    return origWriteHead(...args);
  }) as typeof res.writeHead;

  res.on('finish', () => {
    log(method, path, loggedStatus || res.statusCode, Date.now() - startMs);
  });

  if (method === 'GET' || method === 'DELETE') {
    handleMcpRequest(token, req, res, undefined).catch((err: unknown) => {
      console.error('[MCP] Error handling GET/DELETE:', err);
      if (!res.headersSent) sendJson(res, 500, { error: 'Internal server error' });
    });
    return;
  }

  if (method !== 'POST') {
    sendJson(res, 405, { error: 'Method not allowed' });
    return;
  }

  let rawBody = '';
  req.setEncoding('utf8');
  req.on('data', (chunk: string) => { rawBody += chunk; });

  req.on('end', () => {
    let body: unknown;
    try {
      body = JSON.parse(rawBody);
    } catch {
      sendJson(res, 400, { error: 'Invalid JSON body' });
      return;
    }

    const rpcMethod = (body as { method?: string })?.method ?? '(unknown)';
    console.log(`[MCP] POST ${path} rpc=${rpcMethod}`);

    handleMcpRequest(token, req, res, body).catch((err: unknown) => {
      console.error('[MCP] Request error:', err);
      if (!res.headersSent) sendJson(res, 500, { error: 'Internal server error' });
    });
  });

  req.on('error', (err) => {
    console.error('[MCP] Request stream error:', err);
    if (!res.headersSent) sendJson(res, 500, { error: 'Request error' });
  });
});

httpServer.listen(config.MCP_PORT, () => {
  console.log(`[MCP] Element Armory MCP server running on port ${config.MCP_PORT}`);
  console.log(`[MCP] Main server: ${config.MAIN_SERVER_URL}`);
  console.log(`[MCP] Resource URL: ${config.MCP_SERVER_URL}`);
});

httpServer.on('error', (err) => {
  console.error('[MCP] HTTP server error:', err);
  process.exit(1);
});
