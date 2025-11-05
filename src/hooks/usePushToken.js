// src/hooks/usePushToken.js
import { useAuthContext } from '../context/AuthContext';

// Simple hook to access push token from context
export function usePushToken() {
  const { pushToken } = useAuthContext();
  return pushToken;
}