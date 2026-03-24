import { useState, useEffect, useRef, useCallback } from "react";

const API_BASE = "https://api.elementarmory.com";
const STORAGE_KEY_TOKEN = "figma_auth_token";
const STORAGE_KEY_SESSION = "figma_auth_session_id";
const POLL_INTERVAL_MS = 2500;

export type AuthStatus = "loading" | "idle" | "polling" | "authenticated";

export interface AuthState {
  status: AuthStatus;
  token: string | null;
}

/** Read a value from figma.clientStorage via main.ts message passing. */
function readStorage(key: string): Promise<string | null> {
  return new Promise((resolve) => {
    function handler(event: MessageEvent) {
      const msg = event.data?.pluginMessage;
      if (msg?.type === "STORAGE_VALUE" && msg.key === key) {
        window.removeEventListener("message", handler);
        resolve(typeof msg.value === "string" ? msg.value : null);
      }
    }
    window.addEventListener("message", handler);
    parent.postMessage({ pluginMessage: { type: "GET_STORAGE_VALUE", key } }, "*");
  });
}

/** Write a value to figma.clientStorage via main.ts message passing. */
function writeStorage(key: string, value: string | null): Promise<void> {
  return new Promise((resolve) => {
    function handler(event: MessageEvent) {
      const msg = event.data?.pluginMessage;
      if (msg?.type === "STORAGE_SET_OK" && msg.key === key) {
        window.removeEventListener("message", handler);
        resolve();
      }
    }
    window.addEventListener("message", handler);
    parent.postMessage({ pluginMessage: { type: "SET_STORAGE_VALUE", key, value } }, "*");
  });
}

/** Ask main.ts to open a URL in the system browser. */
function openExternalUrl(url: string): void {
  parent.postMessage({ pluginMessage: { type: "OPEN_URL", url } }, "*");
}

/** Validate a token by calling GET /api/me with it. */
async function validateToken(token: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return false;
    const body = await res.json();
    return !!body.user;
  } catch {
    return false;
  }
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({ status: "loading", token: null });
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function stopPolling() {
    if (pollRef.current !== null) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }

  // On mount: restore persisted token if still valid
  useEffect(() => {
    let cancelled = false;
    async function restore() {
      const token = await readStorage(STORAGE_KEY_TOKEN);
      if (cancelled) return;
      if (token && (await validateToken(token))) {
        if (!cancelled) setState({ status: "authenticated", token });
      } else {
        if (token) await writeStorage(STORAGE_KEY_TOKEN, null);
        if (!cancelled) setState({ status: "idle", token: null });
      }
    }
    restore();
    return () => { cancelled = true; };
  }, []);

  /** Initiate the device-code auth flow: open browser, start polling. */
  const initiateAuth = useCallback(async () => {
    stopPolling();

    const sessionId = crypto.randomUUID();
    await writeStorage(STORAGE_KEY_SESSION, sessionId);

    try {
      await fetch(`${API_BASE}/api/figma-sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId }),
      });
    } catch {
      setState({ status: "idle", token: null });
      return;
    }

    const url = `${API_BASE}/figma-auth.html?session_id=${encodeURIComponent(sessionId)}`;
    openExternalUrl(url);
    setState({ status: "polling", token: null });

    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(
          `${API_BASE}/api/figma-sessions/${encodeURIComponent(sessionId)}/poll`
        );
        if (res.status === 404) {
          // Session expired
          stopPolling();
          setState({ status: "idle", token: null });
          return;
        }
        if (!res.ok) return;
        const body = await res.json();
        if (body.status === "complete" && body.token) {
          stopPolling();
          await writeStorage(STORAGE_KEY_TOKEN, body.token);
          await writeStorage(STORAGE_KEY_SESSION, null);
          setState({ status: "authenticated", token: body.token });
        }
      } catch {
        // Network error — keep polling
      }
    }, POLL_INTERVAL_MS);
  }, []);

  const cancelAuth = useCallback(async () => {
    stopPolling();
    await writeStorage(STORAGE_KEY_SESSION, null);
    setState({ status: "idle", token: null });
  }, []);

  const signOut = useCallback(async () => {
    stopPolling();
    await writeStorage(STORAGE_KEY_TOKEN, null);
    await writeStorage(STORAGE_KEY_SESSION, null);
    setState({ status: "idle", token: null });
  }, []);

  // Clean up interval on unmount
  useEffect(() => () => stopPolling(), []);

  return { ...state, initiateAuth, cancelAuth, signOut };
}
