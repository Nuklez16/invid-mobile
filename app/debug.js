// app/debug.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import HamburgerMenu from '../src/components/HamburgerMenu';

export default function Debug() {
  return (
    <>
      <Stack.Screen 
        options={{
          title: "Debug",
          headerLeft: () => <HamburgerMenu />,
        }} 
      />
      <View style={styles.container}>
        <Text style={styles.title}>Debug Information</Text>
        {/* Your debug content */}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 16,
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
});