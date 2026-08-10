import React, { useContext, useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider, AuthContext } from './src/context/AuthContext';
import { ThemeProvider } from './src/context/ThemeContext';
import { SecurityProvider, SecurityContext } from './src/context/SecurityContext';
import { ActivityIndicator, View, AppState } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import LockScreen from './src/screens/LockScreen';
import { initDB } from './src/services/db';
import { syncEngine } from './src/services/syncEngine';
import { pingHealth } from './src/services/healthService';

// Import Navigators
import AppNavigator from './src/navigation/AppNavigator';
import AuthNavigator from './src/navigation/AuthNavigator';

function RootNavigator() {
  const { userToken, isLoading } = useContext(AuthContext);
  const { isLocked, isLoading: isSecurityLoading } = useContext(SecurityContext);

  if (isLoading || isSecurityLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <NavigationContainer>
        {userToken == null ? <AuthNavigator /> : <AppNavigator />}
      </NavigationContainer>
      {userToken != null && isLocked && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999 }}>
          <LockScreen />
        </View>
      )}
    </View>
  );
}

export default function App() {
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    // 1. Instantly ping health endpoint on app launch to wake up cold/sleeping server
    pingHealth();

    // 2. Initialize local SQLite DB & background sync
    const init = async () => {
      await initDB();
      setTimeout(() => {
        syncEngine.syncNow();
      }, 2000);
    };
    init();

    // 3. Re-ping health & sync whenever app returns to foreground from background
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        console.log('App returned to foreground — pinging backend health endpoint...');
        pingHealth();
        syncEngine.syncNow();
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, []);

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <SecurityProvider>
            <RootNavigator />
          </SecurityProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
