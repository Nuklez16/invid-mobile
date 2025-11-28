// src/api/client.js
import { getTokens, saveTokens, clearSession } from '../storage/authStorage';
import { router } from 'expo-router';
import { rawFetch, buildUrl } from './raw';
import { performTokenRefresh } from './refreshToken';

export async function authedFetch(path, opts = {}) {
  const { method = 'GET', body, headers = {} } = opts;

  const { accessToken, refreshToken } = await getTokens();

  if (!accessToken || !refreshToken) {
    console.warn('❌ Missing tokens, redirecting to login');
    await clearSession();
    router.replace('/login');
    return new Response(JSON.stringify({ error: 'missing tokens' }), { status: 401 });
  }

  const endpoint = buildUrl(path);

  const doRequest = async (token) => {
    const finalHeaders = {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    };

    // ❗ Only set content-type when NOT uploading FormData
    if (!(body instanceof FormData)) {
      finalHeaders['Content-Type'] = 'application/json';
    }

    return fetch(endpoint, {
      method,
      headers: finalHeaders,
      body,
    });
  };

  // First attempt
  let res = await doRequest(accessToken);

  // Token refresh flow
  if (res.status === 401 && refreshToken) {
    try {
      console.log('🔄 Token expired, refreshing...');
      
      const data = await performTokenRefresh(refreshToken);

      if (data?.accessToken) {
        await saveTokens({
          accessToken: data.accessToken,
          refreshToken: data.refreshToken || refreshToken,
        });

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
