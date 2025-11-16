// src/storage/authStorage.js
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  ACCESS: 'accessToken',
  REFRESH: 'refreshToken',
  USER: 'user',
};

const tokenListeners = new Set();

function notifyTokenListeners(update = {}) {
  tokenListeners.forEach((listener) => {
    try {
      listener(update);
    } catch (err) {
      console.warn('Token listener failed', err);
    }
  });
}

export function subscribeToTokenChanges(listener) {
  if (typeof listener !== 'function') {
    return () => {};
  }
  tokenListeners.add(listener);
  return () => tokenListeners.delete(listener);
}

export async function saveSession({ accessToken, refreshToken, user }) {
  let serializedUser = 'null';

  if (user != null) {
    try {
      serializedUser = JSON.stringify(user);
    } catch (err) {
      console.warn('Failed to serialize user for session storage', err);
    }
  }

  await AsyncStorage.multiSet([
    [KEYS.ACCESS, accessToken || ''],
    [KEYS.REFRESH, refreshToken || ''],
    [KEYS.USER, serializedUser],
  ]);

  notifyTokenListeners({
    accessToken: accessToken ?? null,
    refreshToken: refreshToken ?? null,
  });
}

export async function loadSession() {
  const [[, accessToken], [, refreshToken], [, rawUser]] =
    await AsyncStorage.multiGet([KEYS.ACCESS, KEYS.REFRESH, KEYS.USER]);

  let parsedUser = null;

  if (rawUser && rawUser !== 'null') {
    try {
      parsedUser = JSON.parse(rawUser);
    } catch (err) {
      console.warn('Failed to parse stored user session, clearing it', err);
      try {
        await AsyncStorage.removeItem(KEYS.USER);
      } catch (removeErr) {
        console.warn('Failed to clear corrupted user session', removeErr);
      }
    }
  }

  return {
    accessToken: accessToken || '',
    refreshToken: refreshToken || '',
    user: parsedUser,
  };
}

export async function clearSession() {
  await AsyncStorage.multiRemove([KEYS.ACCESS, KEYS.REFRESH, KEYS.USER]);
  notifyTokenListeners({ accessToken: null, refreshToken: null });
}

export async function saveTokens({
  accessToken,
  refreshToken,
  fallbackRefreshToken,
}) {
  const tasks = [];

  if (accessToken) {
    tasks.push(AsyncStorage.setItem(KEYS.ACCESS, accessToken));
  }

  const resolvedRefreshToken = refreshToken || fallbackRefreshToken;

  if (resolvedRefreshToken) {
    tasks.push(AsyncStorage.setItem(KEYS.REFRESH, resolvedRefreshToken));
  }

  if (tasks.length) {
    await Promise.all(tasks);
  }

  const nextUpdate = {};
  if (accessToken !== undefined) {
    nextUpdate.accessToken = accessToken || null;
  }
  if (resolvedRefreshToken !== undefined) {
    nextUpdate.refreshToken = resolvedRefreshToken || null;
  }

  if (Object.keys(nextUpdate).length) {
    notifyTokenListeners(nextUpdate);
  }
}

export async function getTokens() {
  const [accessToken, refreshToken] = await Promise.all([
    AsyncStorage.getItem(KEYS.ACCESS),
    AsyncStorage.getItem(KEYS.REFRESH),
  ]);
  return { accessToken, refreshToken };
}
