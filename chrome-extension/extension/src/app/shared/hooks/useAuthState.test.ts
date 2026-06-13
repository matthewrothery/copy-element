import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useAuthState } from "./useAuthState";

type StorageListener = (
  changes: { [key: string]: chrome.storage.StorageChange },
  areaName: string
) => void;

function setupChromeStorage(initial: Record<string, unknown>): {
  listeners: StorageListener[];
  data: Record<string, unknown>;
} {
  const data: Record<string, unknown> = { ...initial };
  const listeners: StorageListener[] = [];

  vi.stubGlobal("chrome", {
    storage: {
      local: {
        get: vi.fn(async (keys: string[]) => {
          const result: Record<string, unknown> = {};
          for (const key of keys) {
            if (key in data) result[key] = data[key];
          }
          return result;
        }),
      },
      onChanged: {
        addListener: vi.fn((listener: StorageListener) => listeners.push(listener)),
        removeListener: vi.fn((listener: StorageListener) => {
          const index = listeners.indexOf(listener);
          if (index >= 0) listeners.splice(index, 1);
        }),
      },
    },
  });

  return { listeners, data };
}

describe("useAuthState", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it("starts signed-out when no token is stored", async () => {
    setupChromeStorage({});
    const { result } = renderHook(() => useAuthState());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.signedIn).toBe(false);
    expect(result.current.userEmail).toBeNull();
    expect(result.current.userPlan).toBeNull();
  });

  it("becomes signed-in when the auth token is added", async () => {
    const { listeners, data } = setupChromeStorage({});
    const { result } = renderHook(() => useAuthState());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.signedIn).toBe(false);

    data["element-armory-auth-token"] = "tok";
    data["element-armory-user-email"] = "user@example.com";
    data["element-armory-user-plan"] = "free";
    listeners.forEach((listener) =>
      listener(
        { "element-armory-auth-token": { newValue: "tok", oldValue: undefined } },
        "local"
      )
    );

    await waitFor(() => expect(result.current.signedIn).toBe(true));
    expect(result.current.userEmail).toBe("user@example.com");
    expect(result.current.userPlan).toBe("free");
  });

  it("becomes signed-out when the auth token is removed", async () => {
    const { listeners, data } = setupChromeStorage({
      "element-armory-auth-token": "tok",
      "element-armory-user-email": "user@example.com",
      "element-armory-user-plan": "free",
    });
    const { result } = renderHook(() => useAuthState());
    await waitFor(() => expect(result.current.signedIn).toBe(true));

    delete data["element-armory-auth-token"];
    delete data["element-armory-user-email"];
    delete data["element-armory-user-plan"];
    listeners.forEach((listener) =>
      listener(
        { "element-armory-auth-token": { newValue: undefined, oldValue: "tok" } },
        "local"
      )
    );

    await waitFor(() => expect(result.current.signedIn).toBe(false));
    expect(result.current.userEmail).toBeNull();
    expect(result.current.userPlan).toBeNull();
  });

  it("updates when only the plan changes", async () => {
    const { listeners, data } = setupChromeStorage({
      "element-armory-auth-token": "tok",
      "element-armory-user-email": "user@example.com",
      "element-armory-user-plan": "free",
    });
    const { result } = renderHook(() => useAuthState());
    await waitFor(() => expect(result.current.userPlan).toBe("free"));

    data["element-armory-user-plan"] = "pro";
    listeners.forEach((listener) =>
      listener(
        { "element-armory-user-plan": { newValue: "pro", oldValue: "free" } },
        "local"
      )
    );

    await waitFor(() => expect(result.current.userPlan).toBe("pro"));
  });

  it("ignores changes to unrelated keys", async () => {
    const { listeners } = setupChromeStorage({});
    const { result } = renderHook(() => useAuthState());
    await waitFor(() => expect(result.current.loading).toBe(false));

    const getSpy = chrome.storage.local.get as ReturnType<typeof vi.fn>;
    const callsBefore = getSpy.mock.calls.length;

    listeners.forEach((listener) =>
      listener({ "some-other-key": { newValue: "x", oldValue: undefined } }, "local")
    );

    expect(getSpy.mock.calls.length).toBe(callsBefore);
  });

  it("removes the storage listener on unmount", async () => {
    setupChromeStorage({});
    const { result, unmount } = renderHook(() => useAuthState());
    await waitFor(() => expect(result.current.loading).toBe(false));

    const removeListener = chrome.storage.onChanged.removeListener as ReturnType<typeof vi.fn>;
    expect(removeListener).not.toHaveBeenCalled();
    unmount();
    expect(removeListener).toHaveBeenCalledTimes(1);
  });

  it("ignores storage changes from other areas", async () => {
    const { listeners, data } = setupChromeStorage({});
    const { result } = renderHook(() => useAuthState());
    await waitFor(() => expect(result.current.loading).toBe(false));

    data["element-armory-auth-token"] = "tok";
    listeners.forEach((listener) =>
      listener(
        { "element-armory-auth-token": { newValue: "tok", oldValue: undefined } },
        "sync"
      )
    );

    expect(result.current.signedIn).toBe(false);
  });
});
