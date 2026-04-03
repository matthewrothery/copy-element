/**
 * Lightweight analytics module for the Chrome extension.
 * Fire-and-forget: errors are caught and logged, never thrown.
 * Uses install_id as the persistent identifier (no cookies available in extension context).
 */

const COLLECT_URL = 'https://elementarmory.com/api/collect/event';

// Session ID persisted in chrome.storage.session (cleared when browser closes)
let _sessionId: string | null = null;

async function getSessionId(): Promise<string> {
  if (_sessionId) return _sessionId;
  try {
    const result = await chrome.storage.session.get('ea_ext_sid');
    if (result.ea_ext_sid) {
      _sessionId = result.ea_ext_sid as string;
      return _sessionId;
    }
  } catch {
    // session storage not available — fall through
  }
  const id = crypto.randomUUID();
  _sessionId = id;
  try {
    await chrome.storage.session.set({ ea_ext_sid: id });
  } catch {
    // best-effort
  }
  return id;
}

export type ExtensionEventType =
  | 'extension_installed'
  | 'extension_opened'
  | 'element_captured'
  | 'element_capture_failed'
  | 'element_exported'
  | 'mcp_connected'
  | 'mcp_request_sent'
  | 'account_created'
  | 'library_viewed'
  | 'limit_reached'
  | 'upgrade_modal_shown'
  | 'signin_modal_shown';

/**
 * Convenience wrapper for popup / library / preview contexts.
 * Fetches install_id via background message so callers don't need to pass it.
 */
export async function trackPopupEvent(
  eventType: ExtensionEventType,
  properties?: Record<string, unknown>,
): Promise<void> {
  let installId: string | undefined;
  try {
    const resp = (await chrome.runtime.sendMessage({ type: 'GET_INSTALL_ID' })) as
      | { ok: true; payload: { install_id: string } }
      | { ok: false };
    if (resp?.ok) {
      installId = resp.payload.install_id;
    }
  } catch {
    // best-effort
  }
  await trackExtensionEvent(eventType, installId, properties);
}

export async function trackExtensionEvent(
  eventType: ExtensionEventType,
  installId?: string,
  properties?: Record<string, unknown>,
): Promise<void> {
  try {
    const session_id = await getSessionId();
    const payload = {
      event_type: eventType,
      visitor_id: installId ?? undefined,
      install_id: installId ?? undefined,
      session_id,
      properties,
      device: 'desktop',
      browser: 'chrome',
    };
    await fetch(COLLECT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
    });
  } catch (err) {
    console.warn('[analytics] event failed:', err);
  }
}
