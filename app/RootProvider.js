// app/RootProvider.jsx
import React from 'react';
import { AuthProvider } from '../src/context/AuthContext';

export default function RootProvider({ children }) {
  return <AuthProvider>{children}</AuthProvider>;
}