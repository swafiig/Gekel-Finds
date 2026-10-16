import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Pressable,
  StyleProp,
  Text,
  View,
  ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import KangaPattern from "./KangaPattern";
import { useNav } from "../hooks/useNav";

const PROMPTS = [
  "Black hoodie, size L…",
  "Nike Air Force, size 42…",
  "A gift for my mum…",
  "Sofa covers, 20 pcs bulk…",
  "Original Samsung charger…",
];
const COLORS = ["#FF6B52", "#FA3504", "#C4291F"] as const;

/** The one Ask GEKEL button. `hero` is the big living card, `compact` is the pill used in rows. */
export default function AskGekelButton({
  variant = "hero",
  style,
  onPress,
}: {
  variant?: "hero" | "compact";
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
}) {
  const nav = useNav();
  const go = onPress ?? (() => nav.navigate("AskGekel"));
  const pulse = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(1)).current;
  const [i, setI] = useState(0);

  useEffect(() => {
    const a = Animated.loop(
      Animated.timing(pulse, {
        toValue: 1,
        duration: 1700,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    );
    a.start();
    return () => a.stop();
  }, [pulse]);

  useEffect(() => {
    if (variant !== "hero") return;
    const t = setInterval(() => {
      Animated.timing(fade, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }).start(() => {
        setI((n) => (n + 1) % PROMPTS.length);
        Animated.timing(fade, {
          toValue: 1,
          duration: 260,
          useNativeDriver: true,
        }).start();
      });
    }, 2800);
    return () => clearInterval(t);
  }, [fade, variant]);

  const ring = {
    opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.55, 0] }),
    transform: [
      {
        scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.9] }),
      },
    ],
  };

  if (variant === "compact") {
    return (
      <Pressable
        onPress={go}
        accessibilityRole="button"
        accessibilityLabel="Ask GEKEL"
        style={[
          {
            shadowColor: "#FA3504",
            shadowOpacity: 0.35,
            shadowRadius: 16,
            shadowOffset: { width: 0, height: 8 },
            elevation: 8,
          },
          style,
        ]}
      >
        <LinearGradient
          colors={COLORS}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            height: 50,
            borderRadius: 25,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          <KangaPattern opacity={0.12} />
          <Ionicons name="sparkles" size={18} color="#fff" />
          <Text className="ml-2 text-base font-extrabold text-white">
            Ask GEKEL
          </Text>
        </LinearGradient>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={go}
      accessibilityRole="button"
      accessibilityLabel="Ask GEKEL"
      style={style}
    >
      <LinearGradient
        colors={COLORS}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ borderRadius: 28, padding: 18, overflow: "hidden" }}
      >
        <KangaPattern />
        <View className="flex-row items-center">
          <View className="h-14 w-14 items-center justify-center">
            <Animated.View
              style={[
                {
                  position: "absolute",
                  height: 56,
                  width: 56,
                  borderRadius: 28,
                  backgroundColor: "#fff",
                },
                ring,
              ]}
            />
            <View className="h-14 w-14 items-center justify-center rounded-full bg-white">
              <Ionicons name="sparkles" size={26} color="#FA3504" />
            </View>
          </View>
          <View className="ml-4 flex-1">
            <Text className="text-[11px] font-extrabold tracking-[3px] text-white-80">
              ASK GEKEL
            </Text>
            <Animated.Text
              numberOfLines={1}
              style={{ opacity: fade }}
              className="mt-0.5 text-lg font-extrabold text-white"
            >
              {PROMPTS[i]}
            </Animated.Text>
          </View>
          <View className="flex-row gap-2">
            <View
              style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
              className="h-10 w-10 items-center justify-center rounded-full"
            >
              <Ionicons name="camera" size={18} color="#fff" />
            </View>
            <View
              style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
              className="h-10 w-10 items-center justify-center rounded-full"
            >
              <Ionicons name="mic" size={18} color="#fff" />
            </View>
          </View>
        </View>
        <View className="mt-3.5 flex-row items-center">
          {["We find it", "We seal it", "You get it"].map((t, k) => (
            <View key={t} className="mr-3 flex-row items-center">
              <View className="mr-1.5 h-1.5 w-1.5 rounded-full bg-white" />
              <Text className="text-xs font-semibold text-white-90">{t}</Text>
            </View>
          ))}
        </View>
      </LinearGradient>
    </Pressable>
  );
}
