import { DefaultTheme, NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ActivityIndicator, View } from "react-native";
import { Logo } from "../components/Logo";
import { Login } from "../screens/auth/Login";
import { Welcome } from "../screens/auth/Welcome";
import { useAuth } from "../store/auth";
import { c } from "../theme/tokens";
import { RiderNavigator } from "./RiderNavigator";
import type { AuthStackParams } from "./types";

const Auth = createNativeStackNavigator<AuthStackParams>();

const theme = { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: c.cream, primary: c.brand, card: c.white, text: c.ink, border: c.line } };

export function RootNavigator() {
  const ready = useAuth((s) => s.ready);
  const user = useAuth((s) => s.user);

  if (!ready) {
    return (
      <View className="flex-1 items-center justify-center bg-brand-500">
        <Logo size={96} tone="white" />
        <ActivityIndicator color="#fff" style={{ marginTop: 24 }} />
      </View>
    );
  }

  return (
    <NavigationContainer theme={theme}>
      {user ? (
        <RiderNavigator />
      ) : (
        <Auth.Navigator screenOptions={{ headerShown: false }}>
          <Auth.Screen name="Welcome" component={Welcome} />
          <Auth.Screen name="Login" component={Login} />
        </Auth.Navigator>
      )}
    </NavigationContainer>
  );
}
