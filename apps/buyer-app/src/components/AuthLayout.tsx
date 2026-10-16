import React from "react";
import { Pressable, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import Logo from "./Logo";
import { LOGO_BG } from "../theme";

/** Bold brand hero on top, rounded cream sheet with the form below. Used by every auth screen. */
export default function AuthLayout({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  const nav = useNavigation();
  return (
    <View style={{ flex: 1, backgroundColor: LOGO_BG }}>
      <StatusBar style="light" />
      <View
        pointerEvents="none"
        className="absolute -right-20 -top-16 h-64 w-64 rounded-full bg-white-10"
      />
      <View
        pointerEvents="none"
        className="absolute -left-24 top-24 h-48 w-48 rounded-full bg-black-5"
      />
      <SafeAreaView edges={["top"]}>
        <View className="px-6 pb-7 pt-2">
          <View className="h-12 flex-row items-center justify-between">
            {nav.canGoBack() ? (
              <Pressable
                hitSlop={12}
                onPress={() => nav.goBack()}
                accessibilityLabel="Go back"
                className="h-10 w-10 items-center justify-center rounded-full bg-white-20"
              >
                <Ionicons name="arrow-back" size={20} color="#fff" />
              </Pressable>
            ) : (
              <View />
            )}
            <Logo size={46} />
          </View>
          <Text className="mt-4 text-[32px] font-extrabold leading-9 text-white">
            {title}
          </Text>
          {subtitle ? (
            <Text className="mt-2 text-base leading-6 text-white-85">
              {subtitle}
            </Text>
          ) : null}
        </View>
      </SafeAreaView>

      <KeyboardAwareScrollView
        className="flex-1 rounded-t-[32px] bg-cream dark:bg-surface"
        contentContainerStyle={{
          flexGrow: 1,
          padding: 24,
          paddingTop: 28,
          paddingBottom: 36,
        }}
        keyboardShouldPersistTaps="handled"
        bottomOffset={30}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </KeyboardAwareScrollView>
    </View>
  );
}
