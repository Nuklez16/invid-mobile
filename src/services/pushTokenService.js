// src/services/pushTokenService.js
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

const API_URL = 'https://invid.au/mobile/push/register';

export async function initializePushToken(accessToken) {
  try {
    if (!accessToken) {
      console.warn('[pushTokenService] No access token provided');
      return null;
    }

    // Permissions
    const { status: existing } = await Notifications.getPermissionsAsync();
    let final = existing;
    if (existing !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      final = status;
    }
    if (final !== 'granted') {
      console.warn('[pushTokenService] Permission not granted');
      return null;
    }

    // Ensure Android notification channel exists
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
      });
    }

    // Get Expo projectId
    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ||
      Constants?.easConfig?.projectId ||
      Constants?.expoConfig?.projectId;
    if (!projectId) {
      console.warn('[pushTokenService] Missing projectId in constants');
      return null;
    }

    // Get Expo push token
    const { data } = await Notifications.getExpoPushTokenAsync({ projectId });
    if (!data) {
      console.warn('[pushTokenService] No token received');
      return null;
    }

    console.log('[pushTokenService] Push token:', data);

    // Send to backend
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        expoPushToken: data,
        platform: Platform.OS,
        deviceTime: new Date().toISOString(),
      }),
    });

    const text = await res.text();
    console.log('[pushTokenService] register response:', res.status, text);
    if (!res.ok) {
      console.warn('[pushTokenService] register failed:', res.status);
    }

    return data;
  } catch (err) {
    console.warn('[pushTokenService] Error getting push token', err);
    return null;
  }
}