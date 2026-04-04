import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearAuthToken,
  getAuthState,
  getAuthToken,
  getOrCreateInstallCredentials,
  saveToken,
  saveUserProfile,
} from "./auth-storage";

describe("auth-storage", () => {
  beforeEach(() => {
    vi.stubGlobal("chrome", {
      storage: {
        local: {
          get: vi.fn(async () => ({})),
          set: vi.fn(async () => undefined),
          remove: vi.fn(async () => undefined),
        },
      },
    });
  });

  describe("getOrCreateInstallCredentials", () => {
    it("creates new credentials when none exist", async () => {
      const creds = await getOrCreateInstallCredentials();
      expect(typeof creds.install_id).toBe("string");
      expect(creds.install_id.length).toBeGreaterThan(0);
      expect(typeof creds.install_secret).toBe("string");
      expect(creds.install_secret.length).toBeGreaterThan(0);
      expect(chrome.storage.local.set).toHaveBeenCalled();
    });

    it("returns existing credentials without overwriting", async () => {
      (chrome.storage.local.get as ReturnType<typeof vi.fn>).mockResolvedValue({
        "element-armory-install-id": "existing-id",
        "element-armory-install-secret": "existing-secret",
      });
      const creds = await getOrCreateInstallCredentials();
      expect(creds.install_id).toBe("existing-id");
      expect(creds.install_secret).toBe("existing-secret");
      expect(chrome.storage.local.set).not.toHaveBeenCalled();
    });

    it("generates stable credentials on repeated calls when storage is empty", async () => {
      const first = await getOrCreateInstallCredentials();
      // After the first call, set should have been called with the new creds.
      // Simulate storage now returning those saved creds.
      (chrome.storage.local.get as ReturnType<typeof vi.fn>).mockResolvedValue({
        "element-armory-install-id": first.install_id,
        "element-armory-install-secret": first.install_secret,
      });
      const second = await getOrCreateInstallCredentials();
      expect(second.install_id).toBe(first.install_id);
      expect(second.install_secret).toBe(first.install_secret);
    });
  });

  describe("saveToken / getAuthToken", () => {
    it("saves the token and expires_at to storage", async () => {
      await saveToken("my-jwt", "2030-01-01T00:00:00Z");
      expect(chrome.storage.local.set).toHaveBeenCalledWith(
        expect.objectContaining({
          "element-armory-auth-token": "my-jwt",
          "element-armory-auth-expires-at": "2030-01-01T00:00:00Z",
        })
      );
    });

    it("returns null when no token is stored", async () => {
      const token = await getAuthToken();
      expect(token).toBeNull();
    });

    it("returns the stored token", async () => {
      (chrome.storage.local.get as ReturnType<typeof vi.fn>).mockResolvedValue({
        "element-armory-auth-token": "stored-tok",
      });
      const token = await getAuthToken();
      expect(token).toBe("stored-tok");
    });
  });

  describe("getAuthState", () => {
    it("returns signed_in: false when no token", async () => {
      const state = await getAuthState();
      expect(state.signed_in).toBe(false);
      expect(state.user_email).toBeNull();
      expect(state.user_plan).toBeNull();
    });

    it("returns signed_in: true with email and plan when token is present", async () => {
      (chrome.storage.local.get as ReturnType<typeof vi.fn>).mockResolvedValue({
        "element-armory-auth-token": "tok",
        "element-armory-user-email": "user@example.com",
        "element-armory-user-plan": "pro",
      });
      const state = await getAuthState();
      expect(state.signed_in).toBe(true);
      expect(state.user_email).toBe("user@example.com");
      expect(state.user_plan).toBe("pro");
    });

    it("returns null email and plan when token exists but profile not saved", async () => {
      (chrome.storage.local.get as ReturnType<typeof vi.fn>).mockResolvedValue({
        "element-armory-auth-token": "tok",
      });
      const state = await getAuthState();
      expect(state.signed_in).toBe(true);
      expect(state.user_email).toBeNull();
      expect(state.user_plan).toBeNull();
    });
  });

  describe("saveUserProfile", () => {
    it("stores email and plan", async () => {
      await saveUserProfile("user@example.com", "pro");
      expect(chrome.storage.local.set).toHaveBeenCalledWith(
        expect.objectContaining({
          "element-armory-user-email": "user@example.com",
          "element-armory-user-plan": "pro",
        })
      );
    });
  });

  describe("clearAuthToken", () => {
    it("removes all four auth keys", async () => {
      await clearAuthToken();
      expect(chrome.storage.local.remove).toHaveBeenCalledWith(
        expect.arrayContaining([
          "element-armory-auth-token",
          "element-armory-auth-expires-at",
          "element-armory-user-email",
          "element-armory-user-plan",
        ])
      );
    });
  });
});
