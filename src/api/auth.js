// src/api/auth.js
import { rawFetch } from './raw';
import { performTokenRefresh } from './refreshToken';

// Small helper to safely parse JSON and surface server errors
async function parseJsonSafe(res) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

export async function apiLogin({ username, password }) {
  const res = await rawFetch('/auth/login', {
    method: 'POST',
    body: { username, password },
  });

  const data = await parseJsonSafe(res);

  if (!res.ok) {
    const msg = data?.error || data?.message || 'login failed';
    throw new Error(msg);
  }

  return data;
}

export async function apiVerify2FA({ ticket, code }) {
  const res = await rawFetch('/auth/verify-2fa', {
    method: 'POST',
    body: { ticket, code },
  });

  const data = await parseJsonSafe(res);

  if (!res.ok) {
    const msg = data?.error || data?.message || '2FA failed';
    throw new Error(msg);
  }

  return data;
}

export async function apiLogout() {
  // No body – keeps it simple and avoids any CSRF/body parsing weirdness
  const res = await rawFetch('/auth/logout', {
    method: 'POST',
  });

  if (!res.ok) {
    throw new Error('logout failed');
  }

  return true;
}

/**
 * Register Expo push token for the authenticated user.
 * Uses rawFetch for consistent base URL handling.
 */
export async function apiRegisterPushToken(accessToken, expoPushToken) {
  const res = await rawFetch('/push/register', {
    method: 'POST',
    body: { expoPushToken },
    headers: accessToken
      ? { Authorization: `Bearer ${accessToken}` }
      : {},
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(
      text || 'push register failed',
    );
  }

  return true;
}

export async function apiRefresh({ refreshToken }) {
  return performTokenRefresh(refreshToken);
}
