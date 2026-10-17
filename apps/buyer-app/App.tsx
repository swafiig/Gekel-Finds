import "./global.css";
import React, { useEffect } from "react";
import { Platform } from "react-native";
import { StatusBar } from "expo-status-bar";
import * as NavigationBar from "expo-navigation-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import {
  NavigationContainer,
  DefaultTheme,
  DarkTheme,
} from "@react-navigation/native";
import { AuthProvider } from "./src/context/AuthContext";
import { AppDataProvider } from "./src/context/AppDataContext";
import { UIProvider } from "./src/context/UIContext";
import { ThemeProvider, useTheme } from "./src/context/ThemeContext";
import { OfflineProvider } from "./src/context/OfflineContext";
import RootNavigator from "./src/navigation/RootNavigator";
import OfflineBanner from "./src/components/OfflineBanner";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { usePushNotifications } from "./src/hooks/usePushNotifications";

const lightTheme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: "#F9F7F3", primary: "#FA3504" },
};
const darkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: "#1C1714",
    card: "#1C1714",
    primary: "#FA3504",
  },
};

/** Picks the navigation theme and status bar style once ThemeProvider has resolved the scheme. */
function Themed() {
  const { scheme } = useTheme();
  usePushNotifications();
  useEffect(() => {
    if (Platform.OS === "android") {
      NavigationBar.setStyle(scheme === "dark" ? "light" : "dark");
    }
  }, [scheme]);

  return (
    <NavigationContainer theme={scheme === "dark" ? darkTheme : lightTheme}>
      <StatusBar style={scheme === "dark" ? "light" : "dark"} />
      <RootNavigator />
      <OfflineBanner />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <KeyboardProvider>
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
    </KeyboardProvider>
  );
}
