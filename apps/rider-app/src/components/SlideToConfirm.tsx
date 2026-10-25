import * as Haptics from "expo-haptics";
import { ChevronsRight, Check } from "lucide-react-native";
import { useRef, useState } from "react";
import { Animated, LayoutChangeEvent, PanResponder, Text, View } from "react-native";
import { c } from "../theme/tokens";

const THUMB = 48;

/**
 * Slide track for consequential rider actions (accept a job, confirm delivery).
 * Prevents accidental taps with the phone in a pocket. Calls onConfirm once at ~90%.
 */
export function SlideToConfirm({ label, onConfirm, disabled }: { label: string; onConfirm: () => void; disabled?: boolean }) {
  const x = useRef(new Animated.Value(0)).current;
  const [w, setW] = useState(0);
  const [done, setDone] = useState(false);
  const max = Math.max(0, w - THUMB - 8);
  const stateRef = useRef({ max, disabled, done });
  stateRef.current = { max, disabled, done };

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !stateRef.current.disabled && !stateRef.current.done,
      onMoveShouldSetPanResponder: () => !stateRef.current.disabled && !stateRef.current.done,
      onPanResponderMove: (_, g) => x.setValue(Math.min(Math.max(0, g.dx), stateRef.current.max)),
      onPanResponderRelease: (_, g) => {
        const m = stateRef.current.max;
        if (m > 0 && g.dx >= m * 0.9) {
          Animated.timing(x, { toValue: m, duration: 80, useNativeDriver: false }).start();
          setDone(true);
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
          onConfirm();
          // Re-arm shortly so an error elsewhere doesn't leave the slider dead.
          setTimeout(() => {
            setDone(false);
            Animated.timing(x, { toValue: 0, duration: 200, useNativeDriver: false }).start();
          }, 1500);
        } else {
          Animated.spring(x, { toValue: 0, useNativeDriver: false }).start();
        }
      },
    }),
  ).current;

  const textOpacity = x.interpolate({ inputRange: [0, Math.max(1, max * 0.6)], outputRange: [1, 0], extrapolate: "clamp" });

  return (
    <View
      onLayout={(e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width)}
      className={`h-14 justify-center rounded-full bg-brand-100 ${disabled ? "opacity-50" : ""}`}
      accessibilityRole="adjustable"
      accessibilityLabel={label}
    >
      {/* Animated.* components are styled inline: NativeWind classes don't apply to them. */}
      <Animated.Text
        style={{ opacity: textOpacity, position: "absolute", left: 0, right: 0, textAlign: "center", fontSize: 14, fontWeight: "700", letterSpacing: 1, textTransform: "uppercase", color: c.brand700 }}
      >
        {label}
      </Animated.Text>
      <Animated.View
        {...pan.panHandlers}
        style={{ transform: [{ translateX: x }], width: THUMB, height: THUMB, marginLeft: 4, borderRadius: THUMB / 2, backgroundColor: c.brand, alignItems: "center", justifyContent: "center" }}
      >
        {done ? <Check size={22} color={c.white} /> : <ChevronsRight size={22} color={c.white} />}
      </Animated.View>
    </View>
  );
}
