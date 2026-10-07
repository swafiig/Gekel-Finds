import React from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';

const ROWS: { icon: keyof typeof Ionicons.glyphMap; label: string }[] = [
  { icon: 'location-outline', label: 'Delivery addresses' },
  { icon: 'card-outline', label: 'M-Pesa & payments' },
  { icon: 'notifications-outline', label: 'Notifications' },
  { icon: 'help-circle-outline', label: 'Help & support' },
];

export default function ProfileScreen() {
  const { user, logout } = useAuth();

  const confirmLogout = () =>
    Alert.alert('Log out?', 'You will need to log in again to track your requests.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: logout },
    ]);

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <View className="items-center px-5 pt-8">
        <View className="h-20 w-20 items-center justify-center rounded-full bg-brand-500">
          <Text className="text-3xl font-bold text-white">{(user?.name ?? 'G').charAt(0).toUpperCase()}</Text>
        </View>
        <Text className="mt-3 text-xl font-bold text-ink">{user?.name}</Text>
        <Text className="mt-0.5 text-sm text-ink-soft">{user?.email ?? user?.phone}</Text>
      </View>

      <View className="mx-5 mt-8 overflow-hidden rounded-2xl border border-line">
        {ROWS.map((r, i) => (
          <Pressable key={r.label} className={`h-14 flex-row items-center px-4 active:bg-cream ${i > 0 ? 'border-t border-line' : ''}`}>
            <Ionicons name={r.icon} size={20} color="#57534E" />
            <Text className="ml-3 flex-1 text-base text-ink">{r.label}</Text>
            <Ionicons name="chevron-forward" size={18} color="#A8A29E" />
          </Pressable>
        ))}
      </View>

      <Pressable onPress={confirmLogout} className="mx-5 mt-6 h-14 flex-row items-center justify-center rounded-full border border-line active:bg-cream">
        <Ionicons name="log-out-outline" size={20} color="#DC2626" />
        <Text className="ml-2 text-base font-semibold text-danger">Log out</Text>
      </Pressable>
    </SafeAreaView>
  );
}
