import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../../components/Screen';
import BackHeader from '../../components/BackHeader';
import Chip from '../../components/Chip';
import Button from '../../components/Button';
import AskGekelButton from '../../components/AskGekelButton';
import { RouteProp, useRoute } from '@react-navigation/native';
import { formatKm, haversineKm } from '../../utils/geo';
import type { RootStackParamList } from '../../types/navigation';
import Stars from '../../components/Stars';
import OnlineStatus from '../../components/OnlineStatus';
import EmptyState from '../../components/EmptyState';
import { useAppData } from '../../context/AppDataContext';
import { MARKETS, SELLER_LABEL, SUPPLIERS } from '../../data/mock';
import { useNav } from '../../hooks/useNav';

type Tab = 'wholesale' | 'retail';

export default function SuppliersScreen() {
  const nav = useNav();
  const params = useRoute<RouteProp<RootStackParamList, 'Suppliers'>>().params;
  const { openSupplierChat, userCoords } = useAppData();
  const [tab, setTab] = useState<Tab>(params?.tab ?? 'wholesale');
  const [q, setQ] = useState('');
  const [market, setMarket] = useState<string | undefined>(params?.market);

  // "both" sellers appear under each tab
  const data = useMemo(
    () => SUPPLIERS.filter((s) => (tab === 'wholesale' ? s.type !== 'retail' : s.type !== 'wholesale') && (!market || s.market === market) && (s.name + s.categories.join(' ')).toLowerCase().includes(q.trim().toLowerCase())),
    [tab, q, market],
  );

  return (
    <Screen>
      <BackHeader title="Suppliers" />

      <View className="mt-3 flex-row rounded-full bg-white p-1 border border-line">
        {([['wholesale', 'Wholesalers'], ['retail', 'Retailers']] as const).map(([k, l]) => (
          <Pressable key={k} onPress={() => setTab(k)} accessibilityState={{ selected: tab === k }} className={`h-11 flex-1 items-center justify-center rounded-full ${tab === k ? 'bg-brand-500' : ''}`}>
            <Text className={`text-sm font-bold ${tab === k ? 'text-white' : 'text-ink-soft'}`}>{l}</Text>
          </Pressable>
        ))}
      </View>
      <Text className="mt-2 text-center text-xs text-ink-mute">Sellers that do both wholesale and retail appear in both tabs.</Text>

      <View className="mt-4 flex-row gap-3">
        <AskGekelButton variant="compact" style={{ flex: 1 }} />
        <Button title="I have a supplier" icon="storefront-outline" variant="outline" className="h-12 flex-1 px-3" onPress={() => nav.navigate('OwnSupplier')} />
      </View>

      <View className="mt-4 h-12 flex-row items-center rounded-2xl border border-line bg-white px-4">
        <Ionicons name="search" size={18} color="#A8A29E" />
        <TextInput className="ml-3 flex-1 text-base text-ink" placeholder="Search suppliers or categories" placeholderTextColor="#A8A29E" value={q} onChangeText={setQ} />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-6 my-3 max-h-12" contentContainerStyle={{ paddingHorizontal: 24 }}>
        <Chip label="All markets" active={!market} onPress={() => setMarket(undefined)} />
        {MARKETS.map((m) => <Chip key={m} label={m} active={market === m} onPress={() => setMarket(market === m ? undefined : m)} />)}
      </ScrollView>

      <FlatList
        data={data}
        keyExtractor={(s) => s.id}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={<EmptyState icon="storefront-outline" title="No suppliers found" body="Try another market, or ask GEKEL to find it for you." cta="Ask GEKEL" onCta={() => nav.navigate('AskGekel')} />}
        renderItem={({ item }) => (
          <Pressable onPress={() => nav.navigate('SupplierProfile', { id: item.id })} className="mb-3 rounded-2xl border border-line bg-white p-4 active:bg-cream">
            <View className="flex-row items-center">
              <View className="h-12 w-12 items-center justify-center rounded-full bg-brand-50"><Ionicons name="storefront" size={22} color="#F44236" /></View>
              <View className="ml-3 flex-1">
                <View className="flex-row items-center">
                  <Text numberOfLines={1} className="shrink text-base font-bold text-ink">{item.name}</Text>
                  {item.verified && <Ionicons name="shield-checkmark" size={14} color="#15803D" style={{ marginLeft: 6 }} />}
                </View>
                <View className="mt-0.5 flex-row items-center">
                  <Stars value={item.rating} size={12} />
                  <Text className="ml-1.5 text-xs font-semibold text-ink">{item.rating}</Text>
                  <Text className="ml-1 text-xs text-ink-mute">({item.reviewCount})</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#A8A29E" />
            </View>
            <View className="mt-3 flex-row flex-wrap items-center gap-2">
              <View className="rounded-full bg-ink px-2.5 py-1"><Text className="text-xs font-semibold text-white">{SELLER_LABEL[item.type]}</Text></View>
              <View className="rounded-full bg-cream px-2.5 py-1"><Text className="text-xs font-semibold text-ink-soft">{item.market}{userCoords ? ` · ${formatKm(haversineKm(userCoords, item.location))}` : ''}</Text></View>
              {item.categories.map((c) => <View key={c} className="rounded-full bg-cream px-2.5 py-1"><Text className="text-xs font-semibold text-ink-soft">{c}</Text></View>)}
            </View>
            <View className="mt-3 flex-row items-center justify-between">
              <OnlineStatus online={item.online} lastSeen={item.lastSeen} />
              <Pressable hitSlop={8} onPress={() => nav.navigate('ChatRoom', { id: openSupplierChat(item.id) })} className="flex-row items-center">
                <Ionicons name="chatbubble-ellipses-outline" size={16} color="#F44236" />
                <Text className="ml-1 text-sm font-semibold text-brand-600">Message</Text>
              </Pressable>
            </View>
          </Pressable>
        )}
      />
    </Screen>
  );
}
