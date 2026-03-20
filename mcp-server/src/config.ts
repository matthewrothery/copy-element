import 'dotenv/config';

export interface McpConfig {
  MCP_PORT: number;
  MAIN_SERVER_URL: string;
  INTERNAL_API_KEY: string;
  ANTHROPIC_API_KEY: string;
}

function getConfig(): McpConfig {
  const portRaw = process.env.MCP_PORT;
  const port = portRaw ? parseInt(portRaw, 10) : 3001;
  return {
    MCP_PORT: Number.isNaN(port) ? 3001 : port,
    MAIN_SERVER_URL: process.env.MAIN_SERVER_URL ?? 'http://localhost:3000',
    INTERNAL_API_KEY: process.env.INTERNAL_API_KEY ?? '',
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY ?? '',
  };
}

export const config = getConfig();
