import { config } from '../config.js';

const DEFAULT_TIMEOUT_MS = 5000;

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(
  path: string,
  options: RequestInit & { timeoutMs?: number } = {}
): Promise<T> {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, ...fetchOptions } = options;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${config.MAIN_SERVER_URL}${path}`, {
      ...fetchOptions,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Key': config.INTERNAL_API_KEY,
        ...(fetchOptions.headers ?? {}),
      },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new ApiError(res.status, (body as { error?: string }).error ?? res.statusText);
    }

    return res.json() as Promise<T>;
  } finally {
    clearTimeout(timer);
  }
}

export function apiGet<T>(path: string): Promise<T> {
  return request<T>(path);
}

export function apiPost<T>(path: string, body: unknown, timeoutMs?: number): Promise<T> {
  return request<T>(path, {
    method: 'POST',
    body: JSON.stringify(body),
    timeoutMs,
  });
}
