// app/index.js

import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useAuthContext } from '../src/context/AuthContext';

export default function IndexScreen() {
  const { isLoading, user, accessToken } = useAuthContext();

  useEffect(() => {
    if (isLoading) return;

    const authed = !!user && !!accessToken;

    if (authed) {
      console.log('[Index] Authenticated, going to /home');
      router.replace('/home');
    } else {
      console.log('[Index] No session, going to /login');
      router.replace('/login');
    }
  }, [isLoading, user, accessToken]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
