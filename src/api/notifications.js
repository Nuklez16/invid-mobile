// app/notifications.js
import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import Constants from 'expo-constants';
import { useAuthContext } from '../context/AuthContext';

export default function NotificationsScreen() {
  const { isLoading, user, accessToken } = useAuthContext();
  const [msg, setMsg] = useState('Init');
  const API_BASE = Constants?.expoConfig?.extra?.apiUrl;

  useEffect(() => {
    console.log('[notif] boot', {
      apiBase: API_BASE,
      isLoading,
      hasUser: !!user,
      hasToken: !!accessToken
    });

    // ⬇️ FORCE a request so we can see it in the Network tab
    const url = `${API_BASE || 'https://invid.au'}/mobile/notifications`;
    (async () => {
      try {
        console.log('[notif] fetching', { url });
        const res = await fetch(url, {
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${accessToken || ''}`, // will 401 if empty, that’s fine
          },
        });
        const text = await res.text();
        console.log('[notif] status', res.status, 'body sample:', text.slice(0, 200));
        setMsg(`HTTP ${res.status}`);
      } catch (e) {
        console.log('[notif] fetch error', e);
        setMsg(`Error: ${e.message}`);
      }
    })();
  }, [API_BASE, isLoading, user, accessToken]);

  return (
    <View style={{ flex:1, backgroundColor:'#000', alignItems:'center', justifyContent:'center', padding:16 }}>
      <Text style={{ color:'#fff' }}>Diagnostics: {msg}</Text>
      <Text style={{ color:'#888', marginTop:8, fontSize:12 }}>API_BASE: {API_BASE || '(undefined)'}</Text>
      <Text style={{ color:'#888', marginTop:4, fontSize:12 }}>Token: {accessToken ? 'present' : 'missing'}</Text>
    </View>
  );
}
