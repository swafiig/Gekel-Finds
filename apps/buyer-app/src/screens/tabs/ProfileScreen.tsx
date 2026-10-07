import React from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { useAppData } from '../../context/AppDataContext';
import { useNav } from '../../hooks/useNav';

export default function ProfileScreen() {
  const nav = useNav();
  const { user, logout } = useAuth();
  const { requests, orders, favorites } = useAppData();

  const soon = (t: string) => Alert.alert(t, 'This will be available once the backend is connected.');
  const confirmLogout = () =>
    Alert.alert('Log out?', 'You will need to log in again to track your requests.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: logout },
    ]);

  const rows: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void }[] = [
    { icon: 'storefront-outline', label: 'Browse suppliers', onPress: () => nav.navigate('Suppliers') },
    { icon: 'notifications-outline', label: 'Notifications', onPress: () => nav.navigate('Notifications') },
    { icon: 'location-outline', label: 'Delivery addresses', onPress: () => soon('Delivery addresses') },
    { icon: 'card-outline', label: 'M-Pesa & payments', onPress: () => soon('Payments') },
    { icon: 'help-circle-outline', label: 'Help & support', onPress: () => nav.navigate('ChatRoom', { id: 'c2' }) },
  ];

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        <View className="items-center px-5 pt-8">
          <View className="h-20 w-20 items-center justify-center rounded-full bg-brand-500">
            <Text className="text-3xl font-bold text-white">{(user?.name ?? 'G').charAt(0).toUpperCase()}</Text>
          </View>
          <Text className="mt-3 text-xl font-bold text-ink">{user?.name}</Text>
          <Text className="mt-0.5 text-sm text-ink-soft">{user?.email ?? user?.phone}</Text>
        </View>

        <View className="mx-5 mt-6 flex-row rounded-2xl bg-cream py-4">
          {[['Requests', requests.length], ['Orders', orders.length], ['Saved', favorites.length]].map(([l, n], i) => (
            <View key={l as string} className={`flex-1 items-center ${i > 0 ? 'border-l border-line' : ''}`}>
              <Text className="text-xl font-extrabold text-ink">{n}</Text>
              <Text className="text-xs text-ink-soft">{l}</Text>
            </View>
          ))}
        </View>

        <View className="mx-5 mt-6 overflow-hidden rounded-2xl border border-line">
          {rows.map((r, i) => (
            <Pressable key={r.label} onPress={r.onPress} className={`h-14 flex-row items-center px-4 active:bg-cream ${i > 0 ? 'border-t border-line' : ''}`}>
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
      </ScrollView>
    </SafeAreaView>
  );
}
