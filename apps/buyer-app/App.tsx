import './global.css';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { AuthProvider } from './src/context/AuthContext';
import { AppDataProvider } from './src/context/AppDataContext';
import { UIProvider } from './src/context/UIContext';
import RootNavigator from './src/navigation/RootNavigator';

const theme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: '#F9F7F3', primary: '#F44236' },
};

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppDataProvider>
          <UIProvider>
            <NavigationContainer theme={theme}>
              <StatusBar style="dark" />
              <RootNavigator />
            </NavigationContainer>
          </UIProvider>
        </AppDataProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
