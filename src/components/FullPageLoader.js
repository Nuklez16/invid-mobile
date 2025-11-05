// src/components/FullPageLoader.js
import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

export default function FullPageLoader() {
  return (
    <View style={styles.wrap}>
      <ActivityIndicator size="large" />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
