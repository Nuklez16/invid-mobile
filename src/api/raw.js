// src/api/raw.js
import { apiUrl } from '../config/api';

export function buildUrl(path) {
  const p = String(path || '').startsWith('/') ? path : `/${path}`;
  return apiUrl(p);
}

/**
 * Lightweight wrapper around fetch that:
 * - Builds full API URL from a relative path
 * - JSON.stringifys the body if provided
 * - Sets JSON Content-Type by default
 *
 * You can override/extend headers via the headers option.
 */
export async function rawFetch(
  path,
  { method = 'POST', body, headers = {} } = {},
) {
  const endpoint = buildUrl(path);

  return fetch(endpoint, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: body != null ? JSON.stringify(body) : undefined,
  });
}
