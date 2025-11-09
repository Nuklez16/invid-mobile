import React from 'react';
import { Image, View, ActivityIndicator } from 'react-native';
import { useAuthContext } from '../context/AuthContext';
import formatImageUrl from '../utils/formatImageUrl';

export default function SecureAvatar({ path, style, size = 50 }) {
  const { accessToken } = useAuthContext();

  if (!path) {
    return (
      <View
        style={[
          style,
          { 
            width: size, 
            height: size, 
            backgroundColor: '#222', 
            borderRadius: size / 2 
          },
        ]}
      />
    );
  }

  return (
    <Image
      source={{ 
        uri: formatImageUrl(path),
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }}
      style={[style, { 
        width: size, 
        height: size, 
        borderRadius: size / 2 
      }]}
      onError={(e) => console.log('❌ Avatar load error:', e.nativeEvent.error)}
    />
  );
}