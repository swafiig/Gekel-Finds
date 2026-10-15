import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Modal,
  Pressable,
  ScrollView,
  Switch,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import Avatar from "./Avatar";
import Logo from "./Logo";
import { useAuth } from "../context/AuthContext";
import { useAppData } from "../context/AppDataContext";
import { useTheme } from "../context/ThemeContext";
import { useUI } from "../context/UIContext";
import { useNav } from "../hooks/useNav";
import Constants from "expo-constants";

type Item = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  hint?: string;
  onPress: () => void;
};

const APP_VERSION = Constants.expoConfig?.version ?? "1.0.0";
const BUILD_NUMBER = Constants.expoConfig?.android?.versionCode ?? "dev";
/** Slide-in side panel opened from the Home header. */
export default function SideMenu() {
  const { scheme } = useTheme();
  const nav = useNav();
  const { width } = useWindowDimensions();
  const W = Math.min(330, width * 0.84);
  const { menuOpen, closeMenu } = useUI();
  const { user, logout } = useAuth();
  const { avatarUri, cart, resellerMode, setResellerMode, requests, orders } =
    useAppData();
  const x = useRef(new Animated.Value(-W)).current;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (menuOpen) {
      setMounted(true);
      Animated.timing(x, {
        toValue: 0,
        duration: 240,
        useNativeDriver: true,
      }).start();
    } else
      Animated.timing(x, {
        toValue: -W,
        duration: 200,
        useNativeDriver: true,
      }).start(() => setMounted(false));
  }, [menuOpen, W, x]);

  const go = (fn: () => void) => () => {
    closeMenu();
    setTimeout(fn, 180);
  };

  const items: Item[] = [
    {
      icon: "cart-outline",
      label: "My cart",
      hint: cart.length ? `${cart.length} items` : undefined,
      onPress: go(() => nav.navigate("Cart")),
    },
    {
      icon: "list-outline",
      label: "My requests",
      hint: requests.length ? String(requests.length) : undefined,
      onPress: go(() => nav.navigate("Requests")),
    },
    {
      icon: "bag-handle-outline",
      label: "My orders",
      hint: orders.length ? String(orders.length) : undefined,
      onPress: go(() => nav.navigate("Main", { screen: "Orders" })),
    },
    {
      icon: "heart-outline",
      label: "Saved finds",
      onPress: go(() => nav.navigate("Main", { screen: "Finds" })),
    },
    {
      icon: "storefront-outline",
      label: "Suppliers",
      onPress: go(() => nav.navigate("Suppliers")),
    },
    {
      icon: "location-outline",
      label: "Saved addresses",
      onPress: go(() => nav.navigate("Addresses")),
    },
    {
      icon: "card-outline",
      label: "M-Pesa numbers",
      onPress: go(() => nav.navigate("Payments")),
    },
    {
      icon: "notifications-outline",
      label: "Notifications",
      onPress: go(() => nav.navigate("Notifications")),
    },
    {
      icon: "help-buoy-outline",
      label: "Help & support",
      onPress: go(() => nav.navigate("ChatRoom", { id: "c2" })),
    },
  ];

  return (
    <Modal
      visible={mounted}
      transparent
      animationType="none"
      onRequestClose={closeMenu}
    >
      <View className="flex-1 flex-row">
        <Animated.View
          style={{ width: W, transform: [{ translateX: x }] }}
          className="bg-white dark:bg-surface"
        >
          <SafeAreaView className="flex-1">
            <View className="bg-brand-500 px-5 pb-5 pt-4">
              <View className="flex-row items-center">
                <View className="rounded-full border-2 border-white">
                  <Avatar uri={avatarUri} name={user?.name} size={58} />
                </View>
                <View className="ml-3 flex-1">
                  <Text
                    numberOfLines={1}
                    className="text-lg font-extrabold text-white"
                  >
                    {user?.name ?? "Karibu"}
                  </Text>
                  <Text numberOfLines={1} className="text-sm text-white-85">
                    {user?.email ?? user?.phone}
                  </Text>
                  <View className="mt-1 flex-row items-center">
                    <Ionicons name="star" size={12} color="#FFD27A" />
                    <Text className="ml-1 text-xs font-semibold text-white">
                      4.9 buyer rating
                    </Text>
                  </View>
                </View>
              </View>
            </View>
            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
              <View className="px-3 pt-3">
                {items.map((it) => (
                  <Pressable
                    key={it.label}
                    onPress={it.onPress}
                    className="h-12 flex-row items-center rounded-xl px-3 active:bg-cream dark:active:bg-surface-soft"
                  >
                    <Ionicons
                      name={it.icon}
                      size={21}
                      color={scheme === "dark" ? "#C7BDB2" : "#57534E"}
                    />
                    <Text className="ml-3.5 flex-1 text-base font-medium text-ink dark:text-sink">
                      {it.label}
                    </Text>
                    {it.hint ? (
                      <View className="rounded-full bg-brand-50 px-2 py-0.5">
                        <Text className="text-xs font-bold text-brand-600">
                          {it.hint}
                        </Text>
                      </View>
                    ) : null}
                  </Pressable>
                ))}
              </View>
              <View className="mx-5 my-3 h-px bg-line dark:bg-surface-line" />
              <View className="mx-5 flex-row items-center rounded-2xl bg-cream dark:bg-surface-soft p-3.5">
                <View className="flex-1 pr-2">
                  <Text className="text-sm font-bold text-ink dark:text-sink">
                    Online seller mode
                  </Text>
                  <Text className="text-xs text-ink-soft dark:text-sink-soft">
                    Wholesale + ship to your customers
                  </Text>
                </View>
                <Switch
                  value={resellerMode}
                  onValueChange={setResellerMode}
                  trackColor={{ true: "#F44236", false: "#E7E2DA" }}
                  thumbColor="#fff"
                />
              </View>
            </ScrollView>
            <View className="border-t border-line dark:border-surface-line px-5 pb-3 pt-3">
              <Pressable
                onPress={go(logout)}
                className="h-11 flex-row items-center"
              >
                <Ionicons name="log-out-outline" size={20} color="#DC2626" />
                <Text className="ml-3 text-base font-semibold text-danger">
                  Log out
                </Text>
              </Pressable>
              <View className="mt-2 flex-row items-center">
                <Logo size={26} />
                <Text className="ml-2 text-xs text-ink-mute dark:text-sink-mute">
                  GEKEL Finds · v{APP_VERSION} ({BUILD_NUMBER})
                </Text>
              </View>
            </View>
          </SafeAreaView>
        </Animated.View>
        <Pressable
          className="flex-1 bg-black-40"
          onPress={closeMenu}
          accessibilityLabel="Close menu"
        />
      </View>
    </Modal>
  );
}
