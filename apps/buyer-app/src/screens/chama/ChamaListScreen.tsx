import React from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../../components/Screen';
import BackHeader from '../../components/BackHeader';
import EmptyState from '../../components/EmptyState';
import ProductImage from '../../components/ProductImage';
import { useAppData } from '../../context/AppDataContext';
import { PRODUCTS, formatKsh } from '../../data/mock';
import { useNav } from '../../hooks/useNav';

/** Group orders you've started or joined — the "5 traders in Machakos splitting 50 sufurias" scenario. */
export default function ChamaListScreen() {
  const nav = useNav();
  const { chamas } = useAppData();

  return (
    <Screen>
      <BackHeader title="Chama group orders" />
      <Text className="mb-4 mt-3 text-sm leading-5 text-ink-soft dark:text-sink-soft">Pool a wholesale order with people you know — everyone picks their own quantity, and you all get the bulk price.</Text>
      <FlatList
        data={chamas} keyExtractor={(c) => c.id} showsVerticalScrollIndicator={false}
        ListEmptyComponent={<EmptyState icon="people-outline" title="No group orders yet" body="Open any wholesale item and tap Chama Buy to start one." cta="Browse finds" onCta={() => nav.navigate('Main', { screen: 'Finds' })} />}
        renderItem={({ item }) => {
          const p = PRODUCTS.find((x) => x.id === item.productId)!;
          const have = item.members.reduce((n, m) => n + m.qty, 0);
          return (
            <Pressable onPress={() => nav.navigate('ChamaDetail', { id: item.id })} className="mb-3 flex-row items-center rounded-2xl border border-line dark:border-surface-line bg-white dark:bg-surface p-3 active:bg-cream dark:active:bg-surface-soft">
              <View className="h-14 w-14 overflow-hidden rounded-xl"><ProductImage product={p} height={56} artSize={40} /></View>
              <View className="ml-3 flex-1">
                <Text className="text-base font-bold text-ink dark:text-sink">{p.name}</Text>
                <Text className="text-sm text-ink-soft dark:text-sink-soft">{have} of {item.targetQty} pieces · {item.members.length} people</Text>
                <View className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-line dark:bg-surface-line"><View style={{ width: `${Math.min(100, (have / item.targetQty) * 100)}%` }} className="h-full rounded-full bg-brand-500" /></View>
              </View>
              <View className={`rounded-full px-2.5 py-1 ${item.status === 'ordered' ? 'bg-green-100' : item.status === 'ready' ? 'bg-brand-50' : 'bg-amber-50'}`}>
                <Text className={`text-[10px] font-extrabold ${item.status === 'ordered' ? 'text-success' : item.status === 'ready' ? 'text-brand-600' : 'text-amber-700'}`}>{item.status === 'ordered' ? 'ORDERED' : item.status === 'ready' ? 'READY' : 'COLLECTING'}</Text>
              </View>
            </Pressable>
          );
        }}
      />
    </Screen>
  );
}
