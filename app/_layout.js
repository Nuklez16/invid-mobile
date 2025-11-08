// app/_layout.js
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
        headerStyle: {
          backgroundColor: '#000',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: 18,
        },
        headerLeft: headerLeft,
      }}
    >
      {/* Home Screen */}
      <Stack.Screen 
        name="home" 
        options={{ 
          title: 'Home',
        }} 
      />
      
      {/* Notifications Screen */}
      <Stack.Screen 
        name="notifications" 
        options={{ 
          title: 'Notifications',
        }} 
      />
	  
	  <Stack.Screen 
  name="search" 
  options={{ 
    title: 'Search',
  }} 
/>
<Stack.Screen 
  name="profile" 
  options={{ 
    title: 'Profile',
  }} 
/>
<Stack.Screen 
  name="user-profile" 
  options={{ 
    title: 'User Profile',
  }} 
/>
<Stack.Screen
  name="forums/topic/[id]"
  options={{ title: 'Loading Topic...' }}
/>

<Stack.Screen
  name="forums/category/[slug]"
  options={{ title: 'Loading Category...' }}
/>
<Stack.Screen 
  name="forums/index" 
  options={{ 
    title: 'Forums',
  }} 
/>
      
      {/* Debug Screen */}
      <Stack.Screen 
        name="debug" 
        options={{ 
          title: 'Debug',
        }} 
      />
      
      {/* Login Screen - No hamburger menu */}
      <Stack.Screen 
        name="login" 
        options={{ 
          title: 'Login',
          headerLeft: undefined, // Explicitly remove hamburger from login
        }} 
      />
      
      {/* Add other screens as needed */}
	  
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