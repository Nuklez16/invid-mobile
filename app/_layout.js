import React from 'react';
import { Stack } from 'expo-router';
import RootProvider from './RootProvider';
import { useAuthContext } from '../src/context/AuthContext';
import HamburgerMenu from '../src/components/HamburgerMenu';

function LayoutContent() {
  const { isLoading, accessToken } = useAuthContext();

  // Show hamburger menu in header only when authenticated
  const headerLeft = !isLoading && accessToken ? () => <HamburgerMenu /> : undefined;

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#000' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold', fontSize: 18 },
        headerLeft: headerLeft,
      }}
    >

      {/* Home */}
      <Stack.Screen 
        name="home" 
        options={{ title: 'Home' }} 
      />

      {/* Notifications */}
      <Stack.Screen 
        name="notifications" 
        options={{ title: 'Notifications' }} 
      />

      {/* Search */}
      <Stack.Screen 
        name="search" 
        options={{ title: 'Search' }} 
      />

      {/* Profile */}
      <Stack.Screen 
        name="profile" 
        options={{ title: 'Profile' }} 
      />

      {/* User Profile */}
      <Stack.Screen 
        name="user-profile" 
        options={{ title: 'User Profile' }} 
      />

      {/* Forums */}
      <Stack.Screen 
        name="forums/index" 
        options={{ title: 'Forums' }} 
      />
      <Stack.Screen
        name="forums/topic/[id]"
        options={{ title: 'Loading Topic...' }}
      />
      <Stack.Screen
        name="forums/category/[slug]"
        options={{ title: 'Loading Category...' }}
      />

      {/* News */}
      <Stack.Screen 
        name="news/index" 
        options={{ title: 'News' }} 
      />
      <Stack.Screen 
        name="news/[slug]" 
        options={{ title: 'Article' }} 
      />

      {/* Debug */}
      <Stack.Screen 
        name="debug" 
        options={{ title: 'Debug' }} 
      />

      {/* Login */}
      <Stack.Screen 
        name="login" 
        options={{ 
          title: 'Login',
          headerLeft: undefined, // Explicitly remove hamburger from login
        }} 
      />

    </Stack>
  );
}

export default function RootLayout() {
  return (
    <RootProvider>
      <LayoutContent />
    </RootProvider>
  );
}
