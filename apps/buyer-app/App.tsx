import './global.css';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { AuthProvider } from './src/context/AuthContext';
import { AppDataProvider } from './src/context/AppDataContext';
import { UIProvider } from './src/context/UIContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { OfflineProvider } from './src/context/OfflineContext';
import RootNavigator from './src/navigation/RootNavigator';
import OfflineBanner from './src/components/OfflineBanner';

const lightTheme = { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: '#F9F7F3', primary: '#F44236' } };
const darkTheme = { ...DarkTheme, colors: { ...DarkTheme.colors, background: '#1C1714', card: '#1C1714', primary: '#F44236' } };

/** Picks the navigation theme and status bar style once ThemeProvider has resolved the scheme. */
function Themed() {
  const { scheme } = useTheme();
  return (
    <NavigationContainer theme={scheme === 'dark' ? darkTheme : lightTheme}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <RootNavigator />
      <OfflineBanner />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <OfflineProvider>
          <AuthProvider>
            <AppDataProvider>
              <UIProvider>
                <Themed />
              </UIProvider>
            </AppDataProvider>
          </AuthProvider>
        </OfflineProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
