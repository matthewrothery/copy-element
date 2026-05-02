import 'dotenv/config';

export interface McpConfig {
  MCP_PORT: number;
  MAIN_SERVER_URL: string;
  MAIN_SERVER_ISSUER: string;
  INTERNAL_API_KEY: string;
  ANTHROPIC_API_KEY: string;
  JWT_SECRET: string;
  MCP_SERVER_URL: string;
}

function getConfig(): McpConfig {
  const portRaw = process.env.MCP_PORT;
  const port = portRaw ? parseInt(portRaw, 10) : 3001;
  const mainServerUrl = process.env.MAIN_SERVER_URL ?? 'http://localhost:3000';
  return {
    MCP_PORT: Number.isNaN(port) ? 3001 : port,
    MAIN_SERVER_URL: mainServerUrl,
    MAIN_SERVER_ISSUER: process.env.MAIN_SERVER_ISSUER ?? mainServerUrl,
    INTERNAL_API_KEY: process.env.INTERNAL_API_KEY ?? '',
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY ?? '',
    JWT_SECRET: process.env.JWT_SECRET ?? '',
    MCP_SERVER_URL: process.env.MCP_SERVER_URL ?? 'http://localhost:9950',
  };
}

export const config = getConfig();
