import "./global.css";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { RootNavigator } from "./src/navigation";
import { useAuth } from "./src/store/auth";

export default function App() {
  const restore = useAuth((s) => s.restore);
  useEffect(() => {
    void restore();
  }, [restore]);

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <RootNavigator />
    </SafeAreaProvider>
  );
}
