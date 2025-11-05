// app/index.js
import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useAuthContext } from '../src/context/AuthContext';
import { router } from 'expo-router';

export default function IndexScreen() {
  const { isLoading, user, accessToken } = useAuthContext();

  useEffect(() => {
    if (isLoading) return;

    console.log('🏠 Index routing:', { 
      hasUser: !!user, 
      hasToken: !!accessToken,
      userEmail: user?.email 
    });

    // Redirect based on auth status
    if (user && accessToken) {
      console.log('✅ User authenticated, redirecting to home');
      router.replace('/home');
    } else {
      console.log('❌ No user/token, redirecting to login');
      router.replace('/login');
    }
  }, [isLoading, user, accessToken]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
      <ActivityIndicator size="large" color="#fff" />
    </View>
  );
}