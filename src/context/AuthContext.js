// src/context/AuthContext.js

import React, {
  createContext,
  useEffect,
  useState,
  useCallback,
  useContext,
  useRef,
} from 'react';
import { Alert, AppState } from 'react-native';
import { router } from 'expo-router';

import {
  saveSession,
  loadSession,
  clearSession,
  saveTokens,
} from '../storage/authStorage';

import {
  apiLogin,
  apiVerify2FA,
  apiRefresh,
  apiLogout,
} from '../api/auth';

import { getUserProfile } from '../api/user';

export const AuthContext = createContext(null);

const SESSION_EXPIRED_MESSAGE =
  'Your session expired. Please sign in again.';
const RESTORE_SESSION_MESSAGE =
  'We could not restore your session. Please sign in again.';

/**
 * Minimal base64 decoder that works in React Native without extra deps.
 */
function base64Decode(str) {
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let output = '';
  let buffer = 0;
  let bits = 0;

  for (let i = 0; i < str.length; i++) {
    const val = chars.indexOf(str[i]);
    if (val < 0) continue;
    buffer = (buffer << 6) | val;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      output += String.fromCharCode((buffer >> bits) & 0xff);
    }
  }
  return output;
}

/**
 * Safely decode JWT payload. Returns null on failure.
 */
function decodeJwtPayload(token) {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;

    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const padded =
      base64 + '='.repeat((4 - (base64.length % 4 || 4)) % 4);

    const binary = typeof global.atob === 'function'
      ? global.atob(padded)
      : base64Decode(padded);

    const json = decodeURIComponent(
      binary
        .split('')
        .map(
          (c) =>
            '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2),
        )
        .join(''),
    );

    return JSON.parse(json);
  } catch (e) {
    console.warn('Failed to decode JWT payload:', e?.message || e);
    return null;
  }
}

/**
 * Expiry helper. IMPORTANT:
 * - If token missing → expired.
 * - If decode fails → treat as NOT expired so we don’t
 *   accidentally log the user out; backend will enforce.
 */
function isTokenExpired(token, tokenType = 'access') {
  if (!token) {
    console.log(`❌ ${tokenType} token missing`);
    return true;
  }

  const payload = decodeJwtPayload(token);
  if (!payload || !payload.exp) {
    console.log(
      `⚠️ ${tokenType} token has no readable exp; letting backend decide.`,
    );
    return false;
  }

  const expiresAt = payload.exp * 1000;
  const now = Date.now();
  const isExpired = expiresAt < now + 30000; // 30s buffer

  console.log(`${tokenType} token check`, {
    expiresAt: new Date(expiresAt).toISOString(),
    now: new Date(now).toISOString(),
    isExpired,
  });

  return isExpired;
}

export function AuthProvider({ children }) {
  const [isLoading, setIsLoading] = useState(true);

  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);

  const [accessToken, setAccessToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);

  const [pushToken, setPushToken] = useState(null);

  const appState = useRef(AppState.currentState);

  // Load user profile
  const loadUserProfile = useCallback(
    async (token = accessToken) => {
      if (!token) return;
      try {
        console.log('[Auth] Loading user profile…');
        const profile = await getUserProfile(token);
        setUserProfile(profile);
        console.log('[Auth] User profile loaded');
      } catch (err) {
        console.warn('[Auth] Failed to load user profile:', err);
      }
    },
    [accessToken],
  );

  // Logout
  const logout = useCallback(
    async ({ reason, silent } = {}) => {
      try {
        if (refreshToken) {
          await apiLogout();
        }
      } catch (err) {
        console.warn(
          '[Auth] Logout API failed, clearing local session anyway',
        );
      }

      await clearSession();
      setUser(null);
      setUserProfile(null);
      setAccessToken(null);
      setRefreshToken(null);
      setPushToken(null);

      if (reason && !silent) {
        Alert.alert('Signed out', reason);
      }

      router.replace('/login');
    },
    [refreshToken],
  );

  // Refresh tokens
  const refreshAccessToken = useCallback(async () => {
    const currentRefresh = refreshToken;

    if (!currentRefresh) {
      console.warn('[Auth] Refresh requested without refresh token');
      await logout({ reason: SESSION_EXPIRED_MESSAGE });
      throw new Error('Missing refresh token');
    }

    try {
      console.log('[Auth] Attempting token refresh…');
      const data = await apiRefresh({ refreshToken: currentRefresh });

      if (!data?.accessToken) {
        throw new Error('No access token in refresh response');
      }

      const nextRefresh = data.refreshToken || currentRefresh;

      setAccessToken(data.accessToken);
      setRefreshToken(nextRefresh);

      await saveTokens({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        fallbackRefreshToken: currentRefresh,
      });

      console.log('[Auth] Token refresh successful');
      return data.accessToken;
    } catch (err) {
      console.warn('[Auth] Token refresh failed:', err?.message || err);
      await logout({ reason: SESSION_EXPIRED_MESSAGE });
      throw err;
    }
  }, [refreshToken, logout]);

  // Initial session restore
  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        console.log('[Auth] Checking existing session…');
        const sess = await loadSession();
        if (!isMounted) return;

        if (!sess?.accessToken || !sess?.refreshToken) {
          console.log('[Auth] No saved session');
          setIsLoading(false);
          return;
        }

        console.log('[Auth] Session loaded from storage');
        setUser(sess.user || null);
        setRefreshToken(sess.refreshToken);

        const accessExpired = isTokenExpired(
          sess.accessToken,
          'access',
        );
        const refreshExpired = isTokenExpired(
          sess.refreshToken,
          'refresh',
        );

        if (!accessExpired) {
          setAccessToken(sess.accessToken);
          await loadUserProfile(sess.accessToken);
          setIsLoading(false);
          return;
        }

        if (refreshExpired) {
          console.log(
            '[Auth] Stored refresh token expired, logging out',
          );
          await logout({
            reason: SESSION_EXPIRED_MESSAGE,
            silent: true,
          });
          setIsLoading(false);
          return;
        }

        // Try refresh with stored refresh token
        try {
          const data = await apiRefresh({
            refreshToken: sess.refreshToken,
          });

          if (!isMounted) return;

          if (!data?.accessToken) {
            throw new Error('No access token in refresh response');
          }

          const nextRefresh =
            data.refreshToken || sess.refreshToken;

          setAccessToken(data.accessToken);
          setRefreshToken(nextRefresh);

          await saveTokens({
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
            fallbackRefreshToken: sess.refreshToken,
          });

          await loadUserProfile(data.accessToken);
        } catch (err) {
          console.warn(
            '[Auth] Refresh during restore failed:',
            err?.message || err,
          );
          if (isMounted) {
            await logout({
              reason: SESSION_EXPIRED_MESSAGE,
              silent: true,
            });
          }
        }
      } catch (err) {
        console.warn(
          '[Auth] Error restoring session:',
          err?.message || err,
        );
        if (isMounted) {
          await logout({
            reason: RESTORE_SESSION_MESSAGE,
            silent: true,
          });
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [loadUserProfile, logout]);

  // Foreground refresh on app resume
  useEffect(() => {
    if (isLoading) return;

    const subscription = AppState.addEventListener(
      'change',
      (nextState) => {
        const prev = appState.current;
        appState.current = nextState;

        if (
          prev?.match(/inactive|background/) &&
          nextState === 'active' &&
          refreshToken
        ) {
          const needsRefresh =
            !accessToken || isTokenExpired(accessToken, 'access');

          if (needsRefresh) {
            refreshAccessToken().catch((err) =>
              console.warn(
                '[Auth] Failed to refresh on foreground:',
                err?.message || err,
              ),
            );
          }
        }
      },
    );

    return () => {
      subscription?.remove?.();
    };
  }, [
    isLoading,
    accessToken,
    refreshToken,
    refreshAccessToken,
  ]);

  // Initialize push token once authenticated
  useEffect(() => {
    if (!accessToken || isLoading) return;

    (async () => {
      try {
        const { initializePushToken } = await import(
          '../services/pushTokenService'
        );
        const token = await initializePushToken(accessToken);
        setPushToken(token);
      } catch (err) {
        console.warn(
          '[Auth] Push token initialization failed:',
          err?.message || err,
        );
      }
    })();
  }, [accessToken, isLoading]);

  // Login (supports 2FA flow)
  const login = useCallback(
    async ({ username, password, code, ticket }) => {
      let resp;

      try {
        if (ticket && code) {
          resp = await apiVerify2FA({ ticket, code });
        } else {
          resp = await apiLogin({ username, password });

          if (resp?.status === 'TWOFA_REQUIRED') {
            // Caller should handle 2FA step
            return resp;
          }
        }
      } catch (err) {
        console.error('[Auth] Login error:', err);
        throw new Error(err?.message || 'Login failed');
      }

      const { accessToken: a, refreshToken: r, user: u } = resp || {};

      if (!a || !r || !u) {
        throw new Error('Invalid login response from server');
      }

      setUser(u);
      setAccessToken(a);
      setRefreshToken(r);

      await saveSession({
        accessToken: a,
        refreshToken: r,
        user: u,
      });

      await loadUserProfile(a);

      return { ok: true };
    },
    [loadUserProfile],
  );

  const value = {
    isLoading,
    user,
    userProfile,
    accessToken,
    refreshToken,
    pushToken,
    login,
    logout,
    refreshAccessToken,
    loadUserProfile,
    setUser,
    setUserProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook
export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error(
      'useAuthContext must be used within an AuthProvider',
    );
  }
  return ctx;
}
