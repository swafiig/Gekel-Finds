import React, { useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ProductImage from '../../components/ProductImage';
import EmptyState from '../../components/EmptyState';
import { useAppData } from '../../context/AppDataContext';
import { ORDER_STAGES, PRODUCTS, formatKsh, timeAgo } from '../../data/mock';
import { useNav } from '../../hooks/useNav';

export default function OrdersScreen() {
  const nav = useNav();
  const { orders } = useAppData();
  const [tab, setTab] = useState<'active' | 'past'>('active');
  const data = orders.filter((o) => (tab === 'active' ? o.stage < 3 : o.stage === 3));

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <Text className="px-5 pt-3 text-[28px] font-extrabold text-ink">Orders</Text>
      <View className="mx-5 my-4 flex-row rounded-full bg-cream p-1">
        {(['active', 'past'] as const).map((t) => (
          <Pressable key={t} onPress={() => setTab(t)} className={`h-10 flex-1 items-center justify-center rounded-full ${tab === t ? 'bg-white shadow-sm' : ''}`}>
            <Text className={`text-sm font-semibold ${tab === t ? 'text-ink' : 'text-ink-mute'}`}>{t === 'active' ? 'Active' : 'Past'}</Text>
          </Pressable>
        ))}
      </View>
      <FlatList
        data={data}
        keyExtractor={(o) => o.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
        ListEmptyComponent={<EmptyState icon="bag-handle" title={tab === 'active' ? 'No active orders' : 'No past orders'} body="Once you order a find, you can track your rider live here." cta="Browse finds" onCta={() => nav.navigate('Main', { screen: 'Finds' })} />}
        renderItem={({ item }) => {
          const p = PRODUCTS.find((x) => x.id === item.productId)!;
          return (
            <Pressable onPress={() => nav.navigate('OrderDetail', { id: item.id })} className="mb-3 rounded-2xl border border-line bg-white p-3 active:bg-cream">
              <View className="flex-row items-center">
                <View className="h-16 w-16 overflow-hidden rounded-xl"><ProductImage product={p} height={64} artSize={44} /></View>
                <View className="ml-3 flex-1">
                  <Text className="text-base font-bold text-ink">{p.name}</Text>
                  <Text className="text-sm text-ink-soft">{formatKsh(item.price + item.deliveryFee)} · {timeAgo(item.createdAt)}</Text>
                  <Text className={`mt-0.5 text-sm font-semibold ${item.stage === 3 ? 'text-success' : 'text-brand-600'}`}>
                    {ORDER_STAGES[item.stage]}{item.stage < 3 && item.etaMinutes > 0 ? ` · ${item.etaMinutes} min` : ''}
                  </Text>
                </View>
              </View>
              <View className="mt-3 flex-row gap-1">
                {ORDER_STAGES.map((_, i) => <View key={i} className={`h-1.5 flex-1 rounded-full ${i <= item.stage ? (item.stage === 3 ? 'bg-success' : 'bg-brand-500') : 'bg-line'}`} />)}
              </View>
            </Pressable>
          );
        }}
      />
    </SafeAreaView>
  );
}
