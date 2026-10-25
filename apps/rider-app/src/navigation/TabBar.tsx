import type { BottomTabNavigationOptions } from "@react-navigation/bottom-tabs";
import { c } from "../theme/tokens";

/** Shared tab bar styling so supplier and rider feel like the same product. */
export const tabScreenOptions: BottomTabNavigationOptions = {
  headerShown: false,
  tabBarActiveTintColor: c.brand,
  tabBarInactiveTintColor: c.inkMute,
  tabBarLabelStyle: { fontSize: 11, fontWeight: "700" },
  tabBarStyle: { backgroundColor: c.white, borderTopColor: c.line, borderTopWidth: 1, height: 64, paddingTop: 6, paddingBottom: 8 },
};
