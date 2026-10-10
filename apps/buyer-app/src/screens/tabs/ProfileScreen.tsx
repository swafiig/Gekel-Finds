import React from 'react';
import { Alert, Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import Avatar from '../../components/Avatar';
import { useAuth } from '../../context/AuthContext';
import { useAppData } from '../../context/AppDataContext';
import { useNav } from '../../hooks/useNav';

export default function ProfileScreen() {
  const nav = useNav();
  const { user, logout } = useAuth();
  const { requests, orders, favorites, resellerMode, setResellerMode, avatarUri, setAvatarUri, addresses } = useAppData();

  const changePhoto = () =>
    Alert.alert('Profile photo', undefined, [
      { text: 'Take photo', onPress: async () => { const p = await ImagePicker.requestCameraPermissionsAsync(); if (!p.granted) return; const r = await ImagePicker.launchCameraAsync({ quality: 0.6, allowsEditing: true, aspect: [1, 1] }); if (!r.canceled) setAvatarUri(r.assets[0].uri); } },
      { text: 'Choose from gallery', onPress: async () => { const p = await ImagePicker.requestMediaLibraryPermissionsAsync(); if (!p.granted) return; const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.6, allowsEditing: true, aspect: [1, 1] }); if (!r.canceled) setAvatarUri(r.assets[0].uri); } },
      ...(avatarUri ? [{ text: 'Remove photo', style: 'destructive' as const, onPress: () => setAvatarUri(undefined) }] : []),
      { text: 'Cancel', style: 'cancel' as const },
    ]);

  const confirmLogout = () => Alert.alert('Log out?', 'You will need to log in again to track your requests.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Log out', style: 'destructive', onPress: logout }]);

  const rows: { icon: keyof typeof Ionicons.glyphMap; label: string; hint?: string; onPress: () => void }[] = [
    { icon: 'location-outline', label: 'Saved addresses', hint: `${addresses.length}`, onPress: () => nav.navigate('Addresses') },
    { icon: 'card-outline', label: 'M-Pesa numbers', onPress: () => nav.navigate('Payments') },
    { icon: 'cart-outline', label: 'My cart', onPress: () => nav.navigate('Cart') },
    { icon: 'storefront-outline', label: 'Browse suppliers', onPress: () => nav.navigate('Suppliers') },
    { icon: 'notifications-outline', label: 'Notifications', onPress: () => nav.navigate('Notifications') },
    { icon: 'help-circle-outline', label: 'Help & support', onPress: () => nav.navigate('ChatRoom', { id: 'c2' }) },
  ];

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        <View className="items-center px-5 pt-8">
          <Pressable onPress={changePhoto} accessibilityLabel="Change profile photo">
            <View className="rounded-full border-4 border-brand-500 p-0.5"><Avatar uri={avatarUri} name={user?.name} size={88} /></View>
            <View className="absolute bottom-0 right-0 h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-ink"><Ionicons name="camera" size={14} color="#fff" /></View>
          </Pressable>
          <Text className="mt-3 text-xl font-extrabold text-ink">{user?.name}</Text>
          <Text className="mt-0.5 text-sm text-ink-soft">{user?.email ?? user?.phone}</Text>
          <View className="mt-2 flex-row items-center rounded-full bg-amber-50 px-3 py-1"><Ionicons name="star" size={13} color="#F5A623" /><Text className="ml-1 text-xs font-bold text-amber-800">4.9 buyer rating · from suppliers</Text></View>
        </View>

        <View className="mx-5 mt-6 flex-row rounded-2xl bg-cream py-4">
          {[['Requests', requests.length], ['Orders', orders.length], ['Saved', favorites.length]].map(([l, n], i) => (
            <View key={l as string} className={`flex-1 items-center ${i > 0 ? 'border-l border-line' : ''}`}><Text className="text-xl font-extrabold text-ink">{n}</Text><Text className="text-xs text-ink-soft">{l}</Text></View>
          ))}
        </View>

        <View className="mx-5 mt-4 flex-row items-center rounded-2xl border border-line p-4">
          <View className="h-10 w-10 items-center justify-center rounded-full bg-brand-50"><Ionicons name="storefront" size={20} color="#F44236" /></View>
          <View className="ml-3 flex-1 pr-2"><Text className="text-base font-bold text-ink">Online seller mode</Text><Text className="text-xs leading-4 text-ink-soft">Order wholesale and ship straight to your customers.</Text></View>
          <Switch value={resellerMode} onValueChange={setResellerMode} trackColor={{ true: '#F44236', false: '#E7E2DA' }} thumbColor="#fff" />
        </View>

        <View className="mx-5 mt-4 overflow-hidden rounded-2xl border border-line">
          {rows.map((r, i) => (
            <Pressable key={r.label} onPress={r.onPress} className={`h-14 flex-row items-center px-4 active:bg-cream ${i > 0 ? 'border-t border-line' : ''}`}>
              <Ionicons name={r.icon} size={20} color="#57534E" /><Text className="ml-3 flex-1 text-base text-ink">{r.label}</Text>
              {r.hint ? <Text className="mr-2 text-sm font-semibold text-ink-mute">{r.hint}</Text> : null}<Ionicons name="chevron-forward" size={18} color="#A8A29E" />
            </Pressable>
          ))}
        </View>

        <Pressable onPress={confirmLogout} className="mx-5 mt-6 h-14 flex-row items-center justify-center rounded-full border border-line active:bg-cream"><Ionicons name="log-out-outline" size={20} color="#DC2626" /><Text className="ml-2 text-base font-semibold text-danger">Log out</Text></Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
