// src/storage/authStorage.js
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  ACCESS: 'accessToken',
  REFRESH: 'refreshToken',
  USER: 'user',
};

export async function saveSession({ accessToken, refreshToken, user }) {
  await AsyncStorage.multiSet([
    [KEYS.ACCESS, accessToken || ''],
    [KEYS.REFRESH, refreshToken || ''],
    [KEYS.USER, JSON.stringify(user || {})],
  ]);
}

export async function loadSession() {
  const [[, accessToken], [, refreshToken], [, rawUser]] =
    await AsyncStorage.multiGet([KEYS.ACCESS, KEYS.REFRESH, KEYS.USER]);

  return {
    accessToken: accessToken || '',
    refreshToken: refreshToken || '',
    user: rawUser ? JSON.parse(rawUser) : null,
  };
}

export async function clearSession() {
  await AsyncStorage.multiRemove([KEYS.ACCESS, KEYS.REFRESH, KEYS.USER]);
}

export async function saveTokens({ accessToken, refreshToken }) {
  if (accessToken) {
    await AsyncStorage.setItem(KEYS.ACCESS, accessToken);
  }
  if (refreshToken) {
    await AsyncStorage.setItem(KEYS.REFRESH, refreshToken);
  }
}

export async function getTokens() {
  const [accessToken, refreshToken] = await Promise.all([
    AsyncStorage.getItem(KEYS.ACCESS),
    AsyncStorage.getItem(KEYS.REFRESH),
  ]);
  return { accessToken, refreshToken };
}
