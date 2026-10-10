import React, { useEffect, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Logo from '../components/Logo';
import { LOGO_BG } from '../theme';

const LINES = ['YOU ASK.', 'WE FIND.', 'WE PACK.', 'WE DELIVER.'];

/** Shown while AuthContext restores the session. The logo background matches the screen, so it floats. */
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
    <View style={{ flex: 1, backgroundColor: LOGO_BG }} className="items-center justify-center">
      <StatusBar style="light" />
      <Animated.View style={{ opacity: logo, transform: [{ scale: logo.interpolate({ inputRange: [0, 1], outputRange: [0.75, 1] }) }] }}>
        <Logo size={260} rounded={false} />
      </Animated.View>
      <View className="mt-6 items-center">
        {LINES.map((l, i) => (
          <Animated.Text key={l} style={{ opacity: lines[i], letterSpacing: 5, color: '#FFE3DF', transform: [{ translateY: lines[i].interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }] }} className="mb-2 text-sm font-bold">
            {l}
          </Animated.Text>
        ))}
      </View>
    </View>
  );
}
