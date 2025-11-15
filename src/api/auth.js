// src/api/auth.js
import { rawFetch } from './raw';

import { apiUrl } from '../config/api';

export async function apiLogin({ username, password }) {
  const res = await rawFetch('/auth/login', {
    method: 'POST',
    body: { username, password },
  });
  if (!res.ok) throw new Error('login failed');
  return res.json();
}

export async function apiVerify2FA({ ticket, code }) {
  const res = await rawFetch('/auth/verify-2fa', {
    method: 'POST',
    body: { ticket, code },
  });
  if (!res.ok) throw new Error('2FA failed');
  return res.json();
}

export async function apiLogout() {
  const res = await rawFetch('/auth/logout', {
  method: 'POST',
  body: {}, // logout endpoint usually requires empty body
});
  if (!res.ok) throw new Error('logout failed');
  return true;
}

export async function apiRegisterPushToken(accessToken, expoPushToken) {
  const res = await fetch(apiUrl('/push/register'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {})
    },
    body: JSON.stringify({ expoPushToken }),
  });

  if (!res.ok) throw new Error('push register failed');
  return true;
}
