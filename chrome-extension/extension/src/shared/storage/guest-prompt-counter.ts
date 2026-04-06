const STORAGE_KEY = "element-armory-guest-prompt-copies";

export const GUEST_PROMPT_LIMIT = 5;

export async function getGuestPromptCount(): Promise<number> {
  const result = await chrome.storage.local.get(STORAGE_KEY);
  const value = result[STORAGE_KEY];
  return typeof value === "number" ? value : 0;
}

export async function incrementGuestPromptCount(): Promise<number> {
  const current = await getGuestPromptCount();
  const next = current + 1;
  await chrome.storage.local.set({ [STORAGE_KEY]: next });
  return next;
}
