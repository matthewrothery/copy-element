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

const USER_CODE_PATTERN = /^\/u_([A-Za-z0-9_-]{24})$/;

function sendError(res: http.ServerResponse, status: number, message: string): void {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: message }));
}

async function handleMcpRequest(
  userCode: string,
  req: http.IncomingMessage,
  res: http.ServerResponse,
  body: unknown
): Promise<void> {
  const user = await validateUserCode(userCode);
  if (!user) {
    sendError(res, 401, 'Invalid or expired MCP token');
    return;
  }

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
  if (req.method !== 'POST') {
    sendError(res, 405, 'Method not allowed');
    return;
  }

  const url = req.url ?? '';
  const match = USER_CODE_PATTERN.exec(url);
  if (!match) {
    sendError(res, 404, 'Not found. Use /u_<your-mcp-code>');
    return;
  }

  const userCode = match[1];
  let rawBody = '';

  req.setEncoding('utf8');
  req.on('data', (chunk: string) => {
    rawBody += chunk;
  });

  req.on('end', () => {
    let body: unknown;
    try {
      body = JSON.parse(rawBody);
    } catch {
      sendError(res, 400, 'Invalid JSON body');
      return;
    }

    handleMcpRequest(userCode, req, res, body).catch((err: unknown) => {
      console.error('MCP request error:', err);
      if (!res.headersSent) {
        sendError(res, 500, 'Internal server error');
      }
    });
  });

  req.on('error', (err) => {
    console.error('Request error:', err);
    if (!res.headersSent) {
      sendError(res, 500, 'Request error');
    }
  });
});

httpServer.listen(config.MCP_PORT, () => {
  console.log(`Element Armory MCP server running on port ${config.MCP_PORT}`);
});

httpServer.on('error', (err) => {
  console.error('HTTP server error:', err);
  process.exit(1);
});
