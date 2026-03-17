const KEY_INSTALL_ID = "element-armory-install-id";
const KEY_INSTALL_SECRET = "element-armory-install-secret";
const KEY_AUTH_TOKEN = "element-armory-auth-token";
const KEY_AUTH_EXPIRES_AT = "element-armory-auth-expires-at";
const KEY_USER_EMAIL = "element-armory-user-email";
const KEY_USER_PLAN = "element-armory-user-plan";

function randomHex(bytes: number): string {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return Array.from(arr)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function getOrCreateInstallCredentials(): Promise<{
  install_id: string;
  install_secret: string;
}> {
  const result = await chrome.storage.local.get([KEY_INSTALL_ID, KEY_INSTALL_SECRET]);
  const existingId = result[KEY_INSTALL_ID] as string | undefined;
  const existingSecret = result[KEY_INSTALL_SECRET] as string | undefined;

  if (existingId && existingSecret) {
    return { install_id: existingId, install_secret: existingSecret };
  }

  const install_id = existingId ?? crypto.randomUUID();
  const install_secret = existingSecret ?? randomHex(16);

  await chrome.storage.local.set({
    [KEY_INSTALL_ID]: install_id,
    [KEY_INSTALL_SECRET]: install_secret,
  });

  return { install_id, install_secret };
}

export async function getInstallCredentials(): Promise<{
  install_id: string;
  install_secret: string;
} | null> {
  const result = await chrome.storage.local.get([KEY_INSTALL_ID, KEY_INSTALL_SECRET]);
  const install_id = result[KEY_INSTALL_ID] as string | undefined;
  const install_secret = result[KEY_INSTALL_SECRET] as string | undefined;
  if (!install_id || !install_secret) return null;
  return { install_id, install_secret };
}

export async function saveToken(token: string, expires_at: string): Promise<void> {
  await chrome.storage.local.set({
    [KEY_AUTH_TOKEN]: token,
    [KEY_AUTH_EXPIRES_AT]: expires_at,
  });
}

export async function saveUserProfile(email: string, plan: string): Promise<void> {
  await chrome.storage.local.set({
    [KEY_USER_EMAIL]: email,
    [KEY_USER_PLAN]: plan,
  });
}

export async function getAuthToken(): Promise<string | null> {
  const result = await chrome.storage.local.get(KEY_AUTH_TOKEN);
  return (result[KEY_AUTH_TOKEN] as string | undefined) ?? null;
}

export async function getAuthExpiresAt(): Promise<string | null> {
  const result = await chrome.storage.local.get(KEY_AUTH_EXPIRES_AT);
  return (result[KEY_AUTH_EXPIRES_AT] as string | undefined) ?? null;
}

export async function getAuthState(): Promise<{
  signed_in: boolean;
  user_email: string | null;
  user_plan: string | null;
}> {
  const result = await chrome.storage.local.get([
    KEY_AUTH_TOKEN,
    KEY_USER_EMAIL,
    KEY_USER_PLAN,
  ]);
  const token = result[KEY_AUTH_TOKEN] as string | undefined;
  return {
    signed_in: !!token,
    user_email: (result[KEY_USER_EMAIL] as string | undefined) ?? null,
    user_plan: (result[KEY_USER_PLAN] as string | undefined) ?? null,
  };
}

export async function clearAuthToken(): Promise<void> {
  await chrome.storage.local.remove([
    KEY_AUTH_TOKEN,
    KEY_AUTH_EXPIRES_AT,
    KEY_USER_EMAIL,
    KEY_USER_PLAN,
  ]);
}
