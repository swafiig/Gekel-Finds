import React, { useEffect, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import Logo from '../components/Logo';

const LINES = ['YOU ASK.', 'WE FIND.', 'WE PACK.', 'WE DELIVER.'];
export const BRAND_GRADIENT = ['#F26A2E', '#E8590C', '#C9480C'] as const;

/** Shown while AuthContext restores the session. One orchestrated reveal, then idle. */
export default function SplashScreen() {
  const logo = useRef(new Animated.Value(0)).current;
  const lines = useRef(LINES.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(logo, { toValue: 1, duration: 650, easing: Easing.out(Easing.back(1.3)), useNativeDriver: true }),
      Animated.stagger(200, lines.map((v) => Animated.timing(v, { toValue: 1, duration: 320, useNativeDriver: true }))),
    ]).start();
  }, [logo, lines]);

  return (
    <LinearGradient colors={BRAND_GRADIENT} start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }} style={{ flex: 1 }}>
      <StatusBar style="light" />
      <View className="flex-1 items-center justify-center">
        <Animated.View style={{ opacity: logo, transform: [{ scale: logo.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] }) }] }}>
          <Logo size={92} withWord />
        </Animated.View>
        <View className="mt-10 items-center">
          {LINES.map((l, i) => (
            <Animated.Text
              key={l}
              style={{ opacity: lines[i], letterSpacing: 5, color: '#FFD9BF', transform: [{ translateY: lines[i].interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }] }}
              className="mb-2 text-sm font-bold"
            >
              {l}
            </Animated.Text>
          ))}
        </View>
      </View>
    </LinearGradient>
  );
}
