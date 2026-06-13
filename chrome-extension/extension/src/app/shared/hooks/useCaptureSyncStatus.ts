import { useEffect, useState } from "react";
import type { CaptureSyncStatusPayload } from "../../../shared/types/messages";

const DISMISS_DELAY_MS = 2000;

export interface SyncStatusState {
  phase: "start" | "done" | null;
  message: string;
}

const IDLE_STATE: SyncStatusState = { phase: null, message: "" };

function isSyncStatusMessage(
  message: unknown
): message is { type: "CAPTURE_SYNC_STATUS"; payload: CaptureSyncStatusPayload } {
  return (
    !!message &&
    typeof message === "object" &&
    (message as { type?: unknown }).type === "CAPTURE_SYNC_STATUS"
  );
}

function describeDone(payload: CaptureSyncStatusPayload): string {
  const synced = payload.synced ?? 0;
  const failed = payload.failed ?? 0;
  if (failed > 0) {
    return "Some captures didn't sync — they'll retry automatically.";
  }
  return synced === 1 ? "1 capture synced" : `${synced} captures synced`;
}

/**
 * Listens for the background's `CAPTURE_SYNC_STATUS` broadcast (sent after sign-in
 * when a guest-capture backlog uploads) and exposes a non-blocking status/toast state.
 * The 'done' phase auto-dismisses after DISMISS_DELAY_MS.
 */
export function useCaptureSyncStatus(): SyncStatusState {
  const [state, setState] = useState<SyncStatusState>(IDLE_STATE);

  useEffect(() => {
    if (typeof chrome === "undefined" || !chrome.runtime?.onMessage?.addListener) {
      return;
    }

    let dismissTimer: number | undefined;

    const listener = (message: unknown): void => {
      if (!isSyncStatusMessage(message)) return;

      if (dismissTimer !== undefined) {
        window.clearTimeout(dismissTimer);
        dismissTimer = undefined;
      }

      if (message.payload.phase === "start") {
        setState({ phase: "start", message: "Syncing your captures…" });
        return;
      }

      setState({ phase: "done", message: describeDone(message.payload) });
      dismissTimer = window.setTimeout(() => setState(IDLE_STATE), DISMISS_DELAY_MS);
    };

    chrome.runtime.onMessage.addListener(listener);
    return () => {
      chrome.runtime.onMessage.removeListener(listener);
      if (dismissTimer !== undefined) window.clearTimeout(dismissTimer);
    };
  }, []);

  return state;
}
