// app/_layout.js

import React from 'react';
import { Stack } from 'expo-router';
import RootProvider from './RootProvider';
import HamburgerMenu from '../src/components/HamburgerMenu';
import NotificationNavigationHandler from '../src/components/NotificationNavigationHandler';
import { useAuthContext } from '../src/context/AuthContext';
import 'react-native-reanimated';

function AppStack() {
  const { isLoading, accessToken } = useAuthContext();
  const showMenu = !isLoading && !!accessToken;

  const withMenu = showMenu
    ? { headerLeft: () => <HamburgerMenu /> }
    : {};

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#000' },
        headerTintColor: '#fff',
        headerTitleStyle: { color: '#fff' },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ title: 'Login' }} />

      {/* Main */}
      <Stack.Screen name="home" options={{ title: 'Home', ...withMenu }} />

      {/* Forums */}
      <Stack.Screen
        name="forums/index"
        options={{ title: 'Forums', ...withMenu }}
      />

      {/* News */}
      <Stack.Screen
        name="news/index"
        options={{ title: 'News', ...withMenu }}
      />
	  
{/* News Article */}
<Stack.Screen
  name="news/[slug]"
  options={{ title: "Loading...", ...withMenu }}
/>
{/* Messages Inbox */}
<Stack.Screen
  name="messages/index"
  options={{ title: 'Messages', ...withMenu }}
/>

{/* Message Thread */}
<Stack.Screen
  name="messages/[conversationId]"
  options={{
    contentStyle: { backgroundColor: "#000" },
    animation: "fade",
    // Android keyboard fix
    headerShown: true
  }}
/>
      {/* Other */}
      <Stack.Screen name="notifications" options={{ title: 'Notifications', ...withMenu }} />
      <Stack.Screen name="search" options={{ title: 'Search', ...withMenu }} />
      <Stack.Screen name="profile" options={{ title: 'Profile', ...withMenu }} />
      <Stack.Screen name="user-profile" options={{ title: 'User Profile', ...withMenu }} />
      <Stack.Screen name="debug" options={{ title: 'Debug', ...withMenu }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <RootProvider>
      <NotificationNavigationHandler />
      <AppStack />
    </RootProvider>
  );
}
