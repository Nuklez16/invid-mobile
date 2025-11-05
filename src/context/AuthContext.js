// src/context/AuthContext.js
import React, {
  createContext,
  useEffect,
  useState,
  useCallback,
  useContext,
} from "react";
import {
  saveSession,
  loadSession,
  clearSession,
  saveTokens,
} from "../storage/authStorage";
import {
  apiLogin,
  apiVerify2FA,
  apiRefresh,
  apiLogout,
} from "../api/auth";
import { router } from "expo-router";
import { getUserProfile } from '../api/user';

export const AuthContext = createContext(null);

// ⏰ JWT decoding helper
function isTokenExpired(token, tokenType = "access") {
  if (!token) {
    console.log(`❌ ${tokenType} token: missing`);
    return true;
  }

  try {
    const base64Url = token.split(".")[1];
    if (!base64Url) {
      console.warn(`⚠️ Invalid ${tokenType} token format`);
      return true;
    }

    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      "="
    );
    const decoded = JSON.parse(atob(padded));

    const expiresAt = decoded.exp * 1000;
    const now = Date.now();
    const isExpired = expiresAt < now + 30000; // 30 sec buffer

    console.log(`🔍 ${tokenType} token check:`, {
      expiresAt: new Date(expiresAt).toISOString(),
      now: new Date(now).toISOString(),
      isExpired,
      timeUntilExpiry: Math.round((expiresAt - now) / 1000 / 60) + " minutes",
    });

    return isExpired;
  } catch (err) {
    console.warn(`⚠️ Failed to decode ${tokenType} token:`, err);
    return true;
  }
}

export function AuthProvider({ children }) {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null); // ← Moved up with other state
  const [accessToken, setAccessToken] = useState("");
  const [refreshToken, setRefreshToken] = useState("");
  const [pushToken, setPushToken] = useState(null);

  // Add this function to load user profile
  const loadUserProfile = useCallback(async () => {
    if (!accessToken) return;
    
    try {
      console.log('🔄 Loading user profile...');
      const profile = await getUserProfile(accessToken);
      setUserProfile(profile);
      console.log('✅ User profile loaded:', profile);
    } catch (error) {
      console.error('❌ Failed to load user profile:', error);
      // Don't throw here, just log the error
    }
  }, [accessToken]);

  // Call loadUserProfile when accessToken changes
  useEffect(() => {
    if (accessToken && !isLoading) {
      loadUserProfile();
    }
  }, [accessToken, isLoading, loadUserProfile]);

  // 🔁 Refresh token logic
  const handleRefresh = useCallback(async () => {
    try {
      const newTokens = await apiRefresh({ refreshToken });
      setAccessToken(newTokens.accessToken);
      setRefreshToken(newTokens.refreshToken);
      await saveTokens({
        accessToken: newTokens.accessToken,
        refreshToken: newTokens.refreshToken,
      });
      return newTokens.accessToken;
    } catch (err) {
      console.warn("❌ Refresh failed", err);
      await handleLogout();
      throw err;
    }
  }, [refreshToken]);

  // 🚪 Logout
  const handleLogout = useCallback(async () => {
    try {
      if (refreshToken) {
        await apiLogout();
      }
    } catch (_) {
      console.warn("Logout API call failed, clearing local session anyway");
    }
    await clearSession();
    setUser(null);
    setUserProfile(null); // ← Clear profile on logout
    setAccessToken("");
    setRefreshToken("");
    setPushToken(null);
    router.replace("/login");
  }, [refreshToken]);

  // 🔓 Load session on boot
  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        console.log("🔄 Checking existing session...");
        const sess = await loadSession();

        if (!isMounted) return;

        if (!sess || !sess.accessToken || !sess.refreshToken) {
          console.log("❌ No valid session found - missing tokens");
          setIsLoading(false);
          return;
        }

        console.log("📦 Session loaded:", {
          hasUser: !!sess.user,
          accessTokenLength: sess.accessToken?.length,
          refreshTokenLength: sess.refreshToken?.length,
        });

        setUser(sess.user);
        setRefreshToken(sess.refreshToken);

        let accessExpired = true;
        let refreshExpired = true;

        try {
          accessExpired = isTokenExpired(sess.accessToken, "access");
          refreshExpired = isTokenExpired(sess.refreshToken, "refresh");
        } catch (error) {
          console.warn("❌ Error checking token expiry:", error);
          accessExpired = true;
          refreshExpired = true;
        }

        if (!accessExpired) {
          console.log("✅ Access token valid, setting immediately");
          setAccessToken(sess.accessToken);
          setIsLoading(false);
          return;
        }

        console.log("🔄 Access token expired, checking refresh token...");
        if (refreshExpired) {
          console.warn("❌ Refresh token expired, logging out");
          if (isMounted) await handleLogout();
          return;
        }

        console.log("🔄 Attempting token refresh...");
        try {
          const newTokens = await apiRefresh({
            refreshToken: sess.refreshToken,
          });

          if (!isMounted) return;

          if (newTokens.accessToken) {
            console.log("🎉 Token refresh successful");
            setAccessToken(newTokens.accessToken);
            setRefreshToken(newTokens.refreshToken || sess.refreshToken);
            await saveTokens({
              accessToken: newTokens.accessToken,
              refreshToken: newTokens.refreshToken || sess.refreshToken,
            });
          } else {
            throw new Error("No access token in refresh response");
          }
        } catch (err) {
          console.warn("❌ Token refresh failed:", err.message);
          setAccessToken(sess.accessToken);
        }
      } catch (error) {
        console.warn("❌ Error loading session:", error);
        if (isMounted) await handleLogout();
      } finally {
        if (isMounted) setIsLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  // 📱 Initialize push token after auth is loaded and we have access token
  useEffect(() => {
    if (!accessToken || isLoading) return;

    (async () => {
      try {
        console.log('📱 Initializing push token system...');
        
        // Dynamically import the push token service to avoid circular deps
        const { initializePushToken } = await import('../services/pushTokenService');
        const token = await initializePushToken(accessToken);
        setPushToken(token);
        
      } catch (error) {
        console.warn('📱 Push token initialization failed:', error);
      }
    })();
  }, [accessToken, isLoading]);

  // 🔑 Login / 2FA
  const handleLogin = useCallback(async ({ username, password, code, ticket }) => {
    let resp;
    try {
      if (ticket && code) {
        resp = await apiVerify2FA({ ticket, code });
      } else {
        resp = await apiLogin({ username, password });
        if (resp.status === "TWOFA_REQUIRED") return resp;
      }
    } catch (err) {
      console.error("[AuthContext] login error", err);
      throw new Error(err?.message || "Login failed");
    }

    const { accessToken: a, refreshToken: r, user: u } = resp;
    setUser(u);
    setAccessToken(a);
    setRefreshToken(r);
    await saveSession({ accessToken: a, refreshToken: r, user: u });
    return { ok: true };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isLoading,
        user,
        userProfile,
        accessToken,
        refreshToken,
        pushToken,
        login: handleLogin,
        logout: handleLogout,
        refreshAccessToken: handleRefresh,
        loadUserProfile, // ← Don't forget to expose this!
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// 🔁 Hook
export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuthContext must be used within an <AuthProvider>");
  }
  return ctx;
}