const KEY_MCP_API_KEY = "element-armory-mcp-api-key";

export async function saveMcpApiKey(key: string): Promise<void> {
  await chrome.storage.local.set({ [KEY_MCP_API_KEY]: key });
}

export async function getMcpApiKey(): Promise<string | null> {
  const result = await chrome.storage.local.get(KEY_MCP_API_KEY);
  return (result[KEY_MCP_API_KEY] as string | undefined) ?? null;
}

export async function clearMcpApiKey(): Promise<void> {
  await chrome.storage.local.remove(KEY_MCP_API_KEY);
}
