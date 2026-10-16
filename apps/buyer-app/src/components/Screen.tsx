import React from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";

interface Props {
  children: React.ReactNode;
  scroll?: boolean;
  bg?: string;
  className?: string;
}

/** Safe area + keyboard-aware scroll. Wrap every screen in this. */
export default function Screen({
  children,
  scroll,
  bg = "bg-cream dark:bg-surface",
  className = "",
}: Props) {
  const inner = scroll ? (
    <KeyboardAwareScrollView
      className="flex-1"
      contentContainerStyle={{ flexGrow: 1 }}
      keyboardShouldPersistTaps="handled"
      bottomOffset={30}
      showsVerticalScrollIndicator={false}
    >
      <View className={`flex-1 px-6 pb-6 ${className}`}>{children}</View>
    </KeyboardAwareScrollView>
  ) : (
    <View className={`flex-1 px-6 pb-6 ${className}`}>{children}</View>
  );

  return (
    <View className={`flex-1 ${bg}`}>
      <SafeAreaView edges={["top", "bottom"]} className="flex-1">
        {inner}
      </SafeAreaView>
    </View>
  );
}
