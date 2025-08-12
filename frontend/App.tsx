import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Navigation
import AppNavigator from './src/navigation/AppNavigator';

// Context
import { AuthProvider } from './src/context/AuthContext';

// API Configuration
import { initializeApiUrl } from './src/config/apiConfig';

export default function App() {
  useEffect(() => {
    // Initialize API URL from AsyncStorage
    initializeApiUrl();
  }, []);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppNavigator />
        <StatusBar style="auto" />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
