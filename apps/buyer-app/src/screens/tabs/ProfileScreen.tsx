import React from 'react';
import { Alert, Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import Avatar from '../../components/Avatar';
import { useAuth } from '../../context/AuthContext';
import { useAppData } from '../../context/AppDataContext';
import { useTheme, ThemePref } from '../../context/ThemeContext';
import { useNav } from '../../hooks/useNav';

const THEME_OPTIONS: { key: ThemePref; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'light', label: 'Light', icon: 'sunny-outline' },
  { key: 'dark', label: 'Dark', icon: 'moon-outline' },
  { key: 'system', label: 'Auto', icon: 'phone-portrait-outline' },
];

export default function ProfileScreen() {
  const nav = useNav();
  const { scheme } = useTheme();
  const iconC = scheme === 'dark' ? '#C7BDB2' : '#57534E';
  const { user, logout } = useAuth();
  const { requests, orders, favorites, resellerMode, setResellerMode, avatarUri, setAvatarUri, addresses, points } = useAppData();
  const { pref, setPref } = useTheme();

  const changePhoto = () =>
    Alert.alert('Profile photo', undefined, [
      { text: 'Take photo', onPress: async () => { const p = await ImagePicker.requestCameraPermissionsAsync(); if (!p.granted) return; const r = await ImagePicker.launchCameraAsync({ quality: 0.6, allowsEditing: true, aspect: [1, 1] }); if (!r.canceled) setAvatarUri(r.assets[0].uri); } },
      { text: 'Choose from gallery', onPress: async () => { const p = await ImagePicker.requestMediaLibraryPermissionsAsync(); if (!p.granted) return; const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.6, allowsEditing: true, aspect: [1, 1] }); if (!r.canceled) setAvatarUri(r.assets[0].uri); } },
      ...(avatarUri ? [{ text: 'Remove photo', style: 'destructive' as const, onPress: () => setAvatarUri(undefined) }] : []),
      { text: 'Cancel', style: 'cancel' as const },
    ]);

  const confirmLogout = () => Alert.alert('Log out?', 'You will need to log in again to track your requests.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Log out', style: 'destructive', onPress: logout }]);

  const rows: { icon: keyof typeof Ionicons.glyphMap; label: string; hint?: string; onPress: () => void }[] = [
    { icon: 'create-outline', label: 'Edit profile', onPress: () => nav.navigate('EditProfile') },
    { icon: 'shield-checkmark-outline', label: 'Security & devices', onPress: () => nav.navigate('Sessions') },
    { icon: 'key-outline', label: 'Change password', onPress: () => nav.navigate('ChangePassword') },
    { icon: 'location-outline', label: 'Saved addresses', hint: `${addresses.length}`, onPress: () => nav.navigate('Addresses') },
    { icon: 'card-outline', label: 'M-Pesa numbers', onPress: () => nav.navigate('Payments') },
    { icon: 'cart-outline', label: 'My cart', onPress: () => nav.navigate('Cart') },
    { icon: 'storefront-outline', label: 'Browse suppliers', onPress: () => nav.navigate('Suppliers') },
    { icon: 'people-outline', label: 'Chama group orders', onPress: () => nav.navigate('ChamaList') },
    { icon: 'briefcase-outline', label: 'Gekel Errands', onPress: () => nav.navigate('Errands') },
    { icon: 'notifications-outline', label: 'Notifications', onPress: () => nav.navigate('Notifications') },
    { icon: 'help-circle-outline', label: 'Help & support', onPress: () => nav.navigate('ChatRoom', { id: 'c2' }) },
  ];
  if (resellerMode) rows.splice(7, 0, { icon: 'layers-outline', label: 'My rented shelf', onPress: () => nav.navigate('Shelf') });

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-surface" edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        <View className="items-center px-5 pt-8">
          <Pressable onPress={changePhoto} accessibilityLabel="Change profile photo">
            <View className="rounded-full border-4 border-brand-500 p-0.5"><Avatar uri={avatarUri} name={user?.name} size={88} /></View>
            <View className="absolute bottom-0 right-0 h-8 w-8 items-center justify-center rounded-full border-2 border-white dark:border-surface bg-ink"><Ionicons name="camera" size={14} color="#fff" /></View>
          </Pressable>
          <Text className="mt-3 text-xl font-extrabold text-ink dark:text-sink">{user?.name}</Text>
          <Text className="mt-0.5 text-sm text-ink-soft dark:text-sink-soft">{user?.email ?? user?.phone}</Text>
          <View className="mt-2 flex-row items-center rounded-full bg-amber-50 px-3 py-1"><Ionicons name="star" size={13} color="#F5A623" /><Text className="ml-1 text-xs font-bold text-amber-800">4.9 buyer rating · from suppliers</Text></View>
        </View>

        <View className="mx-5 mt-6 flex-row rounded-2xl bg-cream dark:bg-surface-soft py-4">
          {[['Requests', requests.length], ['Orders', orders.length], ['Saved', favorites.length]].map(([l, n], i) => (
            <View key={l as string} className={`flex-1 items-center ${i > 0 ? 'border-l border-line dark:border-surface-line' : ''}`}><Text className="text-xl font-extrabold text-ink dark:text-sink">{n}</Text><Text className="text-xs text-ink-soft dark:text-sink-soft">{l}</Text></View>
          ))}
        </View>

        {/* GEKEL Points */}
        <Pressable onPress={() => nav.navigate('Points')} className="mx-5 mt-4 overflow-hidden rounded-2xl bg-brand-500 ">
          <View className="flex-row items-center p-4">
            <View className="h-12 w-12 items-center justify-center rounded-full bg-white-20"><Ionicons name="sparkles" size={22} color="#fff" /></View>
            <View className="ml-3 flex-1">
              <Text className="text-xs font-semibold text-white-85">GEKEL POINTS</Text>
              <Text className="text-xl font-extrabold text-white">{points.toLocaleString('en-KE')} pts</Text>
            </View>
            <View className="rounded-full bg-white px-3 py-1.5"><Text className="text-xs font-extrabold text-brand-600">Redeem</Text></View>
          </View>
        </Pressable>

        <View className="mx-5 mt-4 flex-row items-center rounded-2xl border border-line dark:border-surface-line p-4">
          <View className="h-10 w-10 items-center justify-center rounded-full bg-brand-50"><Ionicons name="storefront" size={20} color="#F44236" /></View>
          <View className="ml-3 flex-1 pr-2"><Text className="text-base font-bold text-ink dark:text-sink">Online seller mode</Text><Text className="text-xs leading-4 text-ink-soft dark:text-sink-soft">Restock from wholesalers, rent a shelf, and ship straight to your customers.</Text></View>
          <Switch value={resellerMode} onValueChange={setResellerMode} trackColor={{ true: '#F44236', false: '#E7E2DA' }} thumbColor="#fff" />
        </View>

        {/* Appearance */}
        <View className="mx-5 mt-4 rounded-2xl border border-line dark:border-surface-line p-4">
          <Text className="mb-3 text-base font-bold text-ink dark:text-sink">Appearance</Text>
          <View className="flex-row rounded-full bg-cream dark:bg-surface-soft p-1">
            {THEME_OPTIONS.map((o) => (
              <Pressable key={o.key} onPress={() => setPref(o.key)} className={`h-10 flex-1 flex-row items-center justify-center rounded-full ${pref === o.key ? 'bg-brand-500' : ''}`}>
                <Ionicons name={o.icon} size={15} color={pref === o.key ? '#fff' : iconC} />
                <Text className={`ml-1.5 text-sm font-semibold ${pref === o.key ? 'text-white' : 'text-ink-soft dark:text-sink-soft'}`}>{o.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View className="mx-5 mt-4 overflow-hidden rounded-2xl border border-line dark:border-surface-line">
          {rows.map((r, i) => (
            <Pressable key={r.label} onPress={r.onPress} className={`h-14 flex-row items-center px-4 active:bg-cream dark:active:bg-surface-soft ${i > 0 ? 'border-t border-line dark:border-surface-line' : ''}`}>
              <Ionicons name={r.icon} size={20} color={iconC} /><Text className="ml-3 flex-1 text-base text-ink dark:text-sink">{r.label}</Text>
              {r.hint ? <Text className="mr-2 text-sm font-semibold text-ink-mute dark:text-sink-mute">{r.hint}</Text> : null}<Ionicons name="chevron-forward" size={18} color="#A8A29E" />
            </Pressable>
          ))}
        </View>

        <Pressable onPress={confirmLogout} className="mx-5 mt-6 h-14 flex-row items-center justify-center rounded-full border border-line dark:border-surface-line active:bg-cream dark:active:bg-surface-soft"><Ionicons name="log-out-outline" size={20} color="#DC2626" /><Text className="ml-2 text-base font-semibold text-danger">Log out</Text></Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
