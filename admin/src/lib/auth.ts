import { createAuthClient } from 'better-auth/client';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';

export const authClient = createAuthClient({
  baseURL: API_BASE,
  fetchOptions: {
    credentials: 'include',
  },
});

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  image?: string | null;
}

export async function getMe(): Promise<AdminUser | null> {
  try {
    const res = await fetch(`${API_BASE}/api/me`, { credentials: 'include' });
    if (!res.ok) return null;
    const data = (await res.json()) as { user?: AdminUser };
    return data.user ?? null;
  } catch {
    return null;
  }
}

export async function getAdminStatus(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/admin/me-admin`, { credentials: 'include' });
    return res.ok;
  } catch {
    return false;
  }
}

export async function signInWithGoogle(callbackURL: string): Promise<void> {
  await authClient.signIn.social({ provider: 'google', callbackURL });
}

export async function signOut(): Promise<void> {
  await authClient.signOut();
}
