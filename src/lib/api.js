// src/lib/api.js
import Constants from 'expo-constants';

export const API_BASE = Constants?.expoConfig?.extra?.apiUrl ?? 'https://invid.au';

export async function apiGet(path, { token, query } = {}) {
  const url = new URL(path, API_BASE);
  if (query) {
    Object.entries(query).forEach(([k, v]) => v != null && url.searchParams.set(k, String(v)));
  }
  const res = await fetch(url.toString(), {
    headers: {
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`GET ${url} -> ${res.status} ${res.statusText} ${text}`);
  }
  return res.json();
}
