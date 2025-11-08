// src/api/client.js
import { getTokens, saveTokens, clearSession } from '../storage/authStorage';
import { apiUrl } from '../config/api';
import { router } from 'expo-router';
import { apiRefresh } from './auth';

function buildUrl(path) {
  const p = String(path || '').startsWith('/') ? path : `/${path}`;
  const url = apiUrl(p);
  return url;
}

export async function authedFetch(path, opts = {}) {
  const { method = 'GET', body, headers = {} } = opts;

  // 1) Load tokens from storage
  const { accessToken, refreshToken } = await getTokens();

  // Check if tokens are empty strings (not just falsy)
  if (!accessToken || accessToken === '' || !refreshToken || refreshToken === '') {
    console.warn('❌ Missing tokens, redirecting to login');
    await clearSession();
    router.replace('/login');
    return new Response(JSON.stringify({ error: 'missing tokens' }), { status: 401 });
  }

  const endpoint = buildUrl(path);

  const doRequest = async (token) => {
    const res = await fetch(endpoint, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body, // Remove JSON.stringify() here - let caller handle it
    });
    return res;
  };

  // 2) First attempt with current access token
  let res = await doRequest(accessToken);

  // 3) If unauthorized, use the centralized apiRefresh function
  if (res.status === 401 && refreshToken) {
    try {
      console.log('🔄 Token expired, attempting refresh...');
      
      // Use the apiRefresh function from auth.js
      const data = await apiRefresh({ refreshToken });
      
      if (data.accessToken) {
        // Save new tokens using the consistent function
        await saveTokens({
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          fallbackRefreshToken: refreshToken,
        });
        
        // Retry the original request with new access token
        res = await doRequest(data.accessToken);
        console.log('✅ Request retried with fresh token');
      }
    } catch (error) {
      console.warn('❌ Refresh failed:', error.message);
      await clearSession();
      router.replace('/login');
      // Return a proper error response instead of throwing
      return new Response(JSON.stringify({ error: 'authentication failed' }), { status: 401 });
    }
  }

  return res;
}

export async function rawFetch(path, { method = 'POST', body, headers = {} } = {}) {
  const endpoint = buildUrl(path);
  return fetch(endpoint, {
    method,
    headers: { 'Content-Type': 'application/json', ...headers },
    body: body ? JSON.stringify(body) : undefined,
  });
}