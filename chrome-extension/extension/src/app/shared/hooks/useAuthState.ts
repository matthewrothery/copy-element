import { useEffect, useState } from "react";
import { getAuthState } from "../../../shared/storage/auth-storage";

const WATCHED_KEYS = [
  "element-armory-auth-token",
  "element-armory-user-email",
  "element-armory-user-plan",
];

export interface AuthState {
  signedIn: boolean;
  userEmail: string | null;
  userPlan: string | null;
  loading: boolean;
}

const INITIAL_STATE: AuthState = {
  signedIn: false,
  userEmail: null,
  userPlan: null,
  loading: true,
};

/**
 * Live auth state for extension views. Reads `getAuthState()` on mount and refreshes
 * whenever the auth token, email, or plan change in `chrome.storage.local` — so open
 * views reflect sign-in/sign-out from another tab without a manual refresh.
 */
export function useAuthState(): AuthState {
  const [state, setState] = useState<AuthState>(INITIAL_STATE);

  useEffect(() => {
    let cancelled = false;

    const refresh = (): void => {
      void getAuthState()
        .then((auth) => {
          if (cancelled) return;
          setState({
            signedIn: auth.signed_in,
            userEmail: auth.user_email,
            userPlan: auth.user_plan,
            loading: false,
          });
        })
        .catch(() => {
          if (cancelled) return;
          setState({ ...INITIAL_STATE, loading: false });
        });
    };

    refresh();

    if (typeof chrome === "undefined" || !chrome.storage?.onChanged?.addListener) {
      return () => {
        cancelled = true;
      };
    }

    const listener = (
      changes: { [key: string]: chrome.storage.StorageChange },
      areaName: string
    ): void => {
      if (areaName !== "local") return;
      if (WATCHED_KEYS.some((key) => key in changes)) {
        refresh();
      }
    };
    chrome.storage.onChanged.addListener(listener);

    return () => {
      cancelled = true;
      chrome.storage.onChanged.removeListener(listener);
    };
  }, []);

  return state;
}
