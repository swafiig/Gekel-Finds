import React from "react";
import {
  ActivityIndicator,
  Pressable,
  PressableProps,
  PressableStateCallbackType,
  StyleProp,
  Text,
  View,
  ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../context/ThemeContext";

type Variant = "primary" | "outline" | "ghost" | "light" | "dark" | "danger";

interface Props extends Omit<PressableProps, "children"> {
  title: string;
  variant?: Variant;
  loading?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  className?: string;
}

const container: Record<Variant, string> = {
  primary: "bg-brand-500",
  outline:
    "bg-white dark:bg-surface border border-line dark:border-surface-line",
  ghost: "bg-transparent",
  light: "bg-white",
  dark: "bg-brand-700",
  danger:
    "bg-white dark:bg-surface border border-red-200 dark:border-red-900-40",
};

const label: Record<Variant, string> = {
  primary: "text-white",
  outline: "text-ink dark:text-sink",
  ghost: "text-ink-soft dark:text-sink-soft",
  light: "text-ink",
  dark: "text-white",
  danger: "text-danger",
};

export default function Button({
  title,
  variant = "primary",
  loading,
  disabled,
  icon,
  className = "",
  style,
  ...rest
}: Props) {
  const off = disabled || loading;
  const solid = variant === "primary" || variant === "dark";
  const { scheme } = useTheme();
  const iconColor = solid
    ? "#fff"
    : variant === "danger"
      ? "#DC2626"
      : scheme === "dark"
        ? "#F2EDE6"
        : "#1C1917";
  const after = !!icon && icon.startsWith("arrow-forward");

  // Normalize `style`: if it's a function, keep it; otherwise wrap it in an array.
  // Then merge with the disabled opacity on top.
  const resolvedStyle:
    | StyleProp<ViewStyle>
    | ((state: PressableStateCallbackType) => StyleProp<ViewStyle>) =
    typeof style === "function"
      ? (state) => [style(state), off ? { opacity: 0.6 } : null]
      : [off ? { opacity: 0.6 } : null, style];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!off, busy: !!loading }}
      disabled={off}
      className={`h-14 flex-row items-center justify-center rounded-full px-6 ${container[variant]} ${className}`}
      style={resolvedStyle}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={solid ? "#fff" : "#F44236"} />
      ) : (
        <View className="flex-row items-center">
          {icon && !after && (
            <Ionicons
              name={icon}
              size={18}
              color={iconColor}
              style={{ marginRight: 8 }}
            />
          )}
          <Text className={`text-base font-semibold ${label[variant]}`}>
            {title}
          </Text>
          {icon && after && (
            <Ionicons
              name={icon}
              size={18}
              color={iconColor}
              style={{ marginLeft: 8 }}
            />
          )}
        </View>
      )}
    </Pressable>
  );
}
