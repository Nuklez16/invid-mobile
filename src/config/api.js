// src/config/api.js
import Constants from 'expo-constants';
import { Platform } from 'react-native';

export const API_BASE =
  (Constants?.expoConfig?.extra && Constants.expoConfig.extra.API_URL) ||
  (Constants?.manifest?.extra && Constants.manifest.extra.API_URL) ||
  (Platform.OS === 'web' ? 'https://invid.au' : 'https://invid.au');

export const apiUrl = (path='') => `${API_BASE}/mobile${path}`;
export const mobile = apiUrl; // optional alias