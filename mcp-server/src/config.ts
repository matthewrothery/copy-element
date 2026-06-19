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

  // MAIN_SERVER_ISSUER must match the main server's BETTER_AUTH_URL exactly
  // (it signs the JWTs this server verifies, and it's advertised publicly via
  // oauth-protected-resource metadata). It must NOT fall back to
  // MAIN_SERVER_URL — in production that's an internal Docker address
  // (http://app:80) that breaks public OAuth discovery for every MCP client.
  if (!process.env.MAIN_SERVER_ISSUER) {
    console.warn(
      '[MCP] WARNING: MAIN_SERVER_ISSUER is not set — falling back to MAIN_SERVER_URL ' +
        `(${mainServerUrl}). This must be a publicly reachable issuer URL matching the ` +
        "main server's BETTER_AUTH_URL, or OAuth discovery and JWT verification will fail."
    );
  }

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
