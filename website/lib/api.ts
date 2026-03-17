/**
 * API base URL for the Element Armory server.
 * Empty string = same origin (use when the host proxies /api/* to the server).
 * Cookie-based auth requires the API to be same origin with the site.
 */
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

export function getApiUrl(path: string): string {
  const base = API_BASE.replace(/\/$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return base + p;
}

export function apiFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const url = getApiUrl(path);
  return fetch(url, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
}
