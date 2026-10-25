import { useEffect, useState } from "react";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/http";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export function usePushNotifications() {
  const { user } = useAuth();
  const [expoPushToken, setExpoPushToken] = useState<string>();

  useEffect(() => {
    async function register() {
      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("default", {
          name: "default",
          importance: Notifications.AndroidImportance.MAX,
        });
      }

      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== "granted") {
        console.log("Failed to get push token");
        return;
      }

      try {
        const token = await Notifications.getExpoPushTokenAsync({
          projectId: Constants.expoConfig?.extra?.eas?.projectId,
        });
        setExpoPushToken(token.data);

        if (user) {
          try {
            await api.post("/users/push-token", { token: token.data });
          } catch (err) {
            console.error("Save failed:", err);
          }
        }
      } catch (e) {
        console.error("Error getting push token", e);
      }
    }
    register();
  }, [user]);

  return { expoPushToken };
}
