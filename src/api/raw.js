// src/api/raw.js
import { apiUrl } from '../config/api';

export function buildUrl(path) {
  const p = String(path || '').startsWith('/') ? path : `/${path}`;
  return apiUrl(p);
}

export async function rawFetch(path, { method = 'POST', body, headers = {} } = {}) {
  const endpoint = buildUrl(path);

  return fetch(endpoint, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}
