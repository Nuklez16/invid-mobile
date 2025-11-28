import { useCallback, useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import * as Linking from 'expo-linking';
import { useRootNavigationState, useRouter } from 'expo-router';
import getNotificationMetadata from '../utils/getNotificationMetadata';

const IN_APP_PREFIXES = [
  '/forums',
  '/messages',
  '/lobby',
  '/pugs',
  '/tournaments',
  '/matches',
  '/user',
  '/profile',
  '/news',
];

const WEB_ONLY_PREFIXES = ['/competitions'];

const stripHost = (target = '') =>
  target.replace(/^https?:\/\/invid\.au/i, '').replace(/^https?:\/\/www\.invid\.au/i, '');

const normalizeTarget = (target) => {
  if (!target) return null;
  let clean = stripHost(String(target).trim());
  if (!clean) return null;
  if (!clean.startsWith('/')) clean = `/${clean}`;
  return clean;
};

const deriveTargetFromPayload = (payload = {}) => {
  const rawTarget =
    payload.target ||
    payload.url ||
    payload.link ||
    payload.path;

  if (rawTarget) return rawTarget;

  const meta = getNotificationMetadata({
    type: payload.type || payload.notification_type,
    data: payload,
  });

  return meta?.target || null;
};

export default function NotificationNavigationHandler() {
  const router = useRouter();
  const navState = useRootNavigationState();
  const hasHandledInitial = useRef(false);

  const openTarget = useCallback(
    (rawTarget) => {
      const cleanTarget = normalizeTarget(rawTarget);
      if (!cleanTarget) return;

      const isWebOnly = WEB_ONLY_PREFIXES.some((prefix) =>
        cleanTarget.startsWith(prefix),
      );

      const shouldOpenInApp =
        !isWebOnly &&
        IN_APP_PREFIXES.some((prefix) => cleanTarget.startsWith(prefix));

      if (shouldOpenInApp) {
        console.log('[push-navigation] routing in-app to', cleanTarget);
        router.push(cleanTarget);
        return;
      }

      const fullUrl = `https://invid.au${cleanTarget}`;
      console.log('[push-navigation] opening in browser', fullUrl);
      Linking.openURL(fullUrl);
    },
    [router],
  );

  const handleResponse = useCallback(
    (response) => {
      const payload = response?.notification?.request?.content?.data || {};
      const target = deriveTargetFromPayload(payload);
      openTarget(target);
    },
    [openTarget],
  );

  useEffect(() => {
    if (!navState?.key) return;

    let isMounted = true;

    (async () => {
      try {
        const lastResponse = await Notifications.getLastNotificationResponseAsync();
        if (isMounted && lastResponse && !hasHandledInitial.current) {
          hasHandledInitial.current = true;
          handleResponse(lastResponse);
        }
      } catch (err) {
        console.warn('[push-navigation] failed to read last notification', err);
      }
    })();

    const subscription = Notifications.addNotificationResponseReceivedListener(
      handleResponse,
    );

    return () => {
      isMounted = false;
      subscription && Notifications.removeNotificationSubscription(subscription);
    };
  }, [handleResponse, navState?.key]);

  return null;
}