import React from 'react';
import { Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import Logo from '../../components/Logo';
import Button from '../../components/Button';
import { useNav } from '../../hooks/useNav';
import { LOGO_BG } from '../../theme';

export default function WelcomeScreen() {
  const nav = useNav();
  return (
    <View style={{ flex: 1, backgroundColor: LOGO_BG }}>
      <StatusBar style="light" />
      <SafeAreaView className="flex-1">
        <View className="flex-1 items-center justify-center">
          <Logo size={260} rounded={false} />
          <View className="mt-6 items-center">
            {['YOU ASK.', 'WE FIND.', 'WE PACK.', 'WE DELIVER.'].map((l) => (
              <Text key={l} style={{ letterSpacing: 5, color: '#FFE3DF' }} className="mb-2 text-sm font-bold">{l}</Text>
            ))}
          </View>
        </View>
        <View className="px-6 pb-4">
          <Button title="Get Started" variant="light" onPress={() => nav.navigate('Register')} />
          <Button title="Login" variant="dark" className="mt-3" onPress={() => nav.navigate('Login')} />
          <View className="mt-5 h-1 w-32 self-center rounded-full bg-white-60" />
        </View>
      </SafeAreaView>
    </View>
  );
}
