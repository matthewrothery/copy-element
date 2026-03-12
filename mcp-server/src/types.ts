/**
 * Snippet shape used by the native host and MCP server.
 * Mirrors the extension's Snippet type for storage/API.
 */
export interface SnippetRecord {
  id: string;
  title: string;
  sourceUrl: string;
  html: string;
  jsx: string;
  thumbnail: string;
  createdAt: number;
  width: number;
  height: number;
  renderContext?: unknown;
  styleBlock?: string;
  rootId?: string;
  externalFontLinks?: string[];
}

/**
 * Native messaging message from extension.
 */
export interface NativeHostMessage {
  type: string;
  payload?: unknown;
}

/**
 * Native messaging response to extension.
 */
export interface NativeHostResponse {
  ok: boolean;
  payload?: unknown;
  error?: string;
}
