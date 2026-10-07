import React from 'react';
import { Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import Logo from '../../components/Logo';
import Button from '../../components/Button';
import { useNav } from '../../hooks/useNav';
import { BRAND_GRADIENT } from '../SplashScreen';

export default function WelcomeScreen() {
  const nav = useNav();
  return (
    <LinearGradient colors={BRAND_GRADIENT} start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }} style={{ flex: 1 }}>
      <StatusBar style="light" />
      <SafeAreaView className="flex-1">
        <View className="flex-1 items-center justify-center">
          <Logo size={92} withWord />
          <View className="mt-10 items-center">
            {['YOU ASK.', 'WE FIND.', 'WE PACK.', 'WE DELIVER.'].map((l) => (
              <Text key={l} style={{ letterSpacing: 5, color: '#FFD9BF' }} className="mb-2 text-sm font-bold">{l}</Text>
            ))}
          </View>
        </View>
        <View className="px-6 pb-4">
          <Button title="Get Started" variant="light" onPress={() => nav.navigate('Register')} />
          <Button title="Login" variant="dark" className="mt-3" onPress={() => nav.navigate('Login')} />
          <View className="mt-5 h-1 w-32 self-center rounded-full bg-white/60" />
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}
