// src/api/client.js
import { getTokens, saveTokens, clearSession } from '../storage/authStorage';
import { router } from 'expo-router';
import { rawFetch, buildUrl } from './raw';
import { performTokenRefresh } from './refreshToken';

export async function authedFetch(path, opts = {}) {
  const { method = 'GET', body, headers = {} } = opts;

  // Load tokens from secure storage
  const { accessToken, refreshToken } = await getTokens();

  if (!accessToken || !refreshToken) {
    console.warn('❌ Missing tokens, redirecting to login');
    await clearSession();
    router.replace('/login');
    return new Response(JSON.stringify({ error: 'missing tokens' }), { status: 401 });
  }

  const endpoint = buildUrl(path);

  const doRequest = async (token) => {
    return fetch(endpoint, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body, // caller must JSON.stringify
    });
  };

  // First request attempt
  let res = await doRequest(accessToken);

  // If token expired → refresh
  if (res.status === 401 && refreshToken) {
    try {
      console.log('🔄 Token expired, refreshing...');
      
      const data = await performTokenRefresh(refreshToken);

      if (data?.accessToken) {
        // Persist new tokens
        await saveTokens({
          accessToken: data.accessToken,
          refreshToken: data.refreshToken || refreshToken,
        });

        // Retry original request
        res = await doRequest(data.accessToken);
        console.log('✅ Retried with fresh token');
      }
    } catch (error) {
      console.warn('❌ Refresh failed:', error.message);
      await clearSession();
      router.replace('/login');

      return new Response(JSON.stringify({ error: 'authentication failed' }), { status: 401 });
    }
  }

  return res;
}

// Unauthenticated HTTP wrapper
export async function rawRequest(path, options = {}) {
  return rawFetch(path, options);
}
