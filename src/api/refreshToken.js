// src/api/refreshToken.js
import { rawFetch } from './raw';

export async function performTokenRefresh(refreshToken) {
  console.log('🔄 Attempting token refresh...');

  const res = await rawFetch('/auth/refresh', {
    method: 'POST',
    body: { refreshToken },
  });

  console.log(`🔄 Refresh response status: ${res.status}`);

  if (!res.ok) {
    const errorText = await res.text().catch(() => 'Unknown error');
    console.warn(`❌ Refresh failed: ${res.status} - ${errorText}`);
    throw new Error(`Refresh failed: ${res.status}`);
  }

  const data = await res.json();
  console.log('✅ Refresh successful');
  return data;
}
