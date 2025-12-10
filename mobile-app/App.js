import React, { useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider, AuthContext } from './src/context/AuthContext';
import { ThemeProvider } from './src/context/ThemeContext';
import { SecurityProvider, SecurityContext } from './src/context/SecurityContext';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import LockScreen from './src/screens/LockScreen';

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
    <NavigationContainer>
      {userToken == null ? <AuthNavigator /> : (
        <>
          <AppNavigator />
          {/* Overlay LockScreen if locked */}
          {isLocked && <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999 }}>
            <LockScreen />
          </View>}
        </>
      )}
    </NavigationContainer>
  );
}

export default function App() {
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
