import React from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../../components/Screen';
import BackHeader from '../../components/BackHeader';
import Button from '../../components/Button';
import EmptyState from '../../components/EmptyState';
import ProductImage from '../../components/ProductImage';
import { RESTOCK_STAGES, useAppData } from '../../context/AppDataContext';
import { PRODUCTS, timeAgo } from '../../data/mock';
import { useNav } from '../../hooks/useNav';

/**
 * Space GEKEL rents to an online seller at our sorting centre. Two ways it fills up:
 * 1) Restock: you order from a wholesaler, our rider collects and shelves it here.
 * 2) Overflow from a Chama/MOQ buy: extra pieces beyond what one retail order needed.
 * When a buyer orders from you at retail size, we pack straight from this shelf and ship — you never touch the parcel.
 */
export default function ShelfScreen() {
  const nav = useNav();
  const { shelf, restockJobs } = useAppData();
  const stocked = Object.entries(shelf.stock).filter(([, qty]) => qty > 0);
  const used = stocked.reduce((n, [, q]) => n + q, 0);
  const active = restockJobs.filter((j) => j.stage < RESTOCK_STAGES.length - 1);

  return (
    <Screen scroll>
      <BackHeader title="My rented shelf" right={<Pressable hitSlop={8} onPress={() => nav.navigate('Restock')}><Ionicons name="add-circle" size={24} color="#F44236" /></Pressable>} />
      <View className="mt-4 rounded-2xl bg-brand-500 p-4">
        <Text className="text-sm text-white-85">Shelf space used</Text>
        <Text className="mt-1 text-3xl font-extrabold text-white">{used} <Text className="text-lg text-white-70">/ {shelf.capacityUnits} units</Text></Text>
        <View className="mt-3 h-2 overflow-hidden rounded-full bg-white-25"><View style={{ width: `${Math.min(100, (used / shelf.capacityUnits) * 100)}%` }} className="h-full rounded-full bg-white" /></View>
      </View>

      {active.length > 0 && (
        <>
          <Text className="mb-3 mt-6 text-lg font-extrabold text-ink dark:text-sink">On the way to your shelf</Text>
          {active.map((j) => {
            const p = PRODUCTS.find((x) => x.id === j.productId)!;
            return (
              <View key={j.id} className="mb-3 flex-row items-center rounded-2xl border border-line dark:border-surface-line bg-white dark:bg-surface p-3">
                <View className="h-12 w-12 overflow-hidden rounded-xl"><ProductImage product={p} height={48} artSize={32} /></View>
                <View className="ml-3 flex-1"><Text className="text-sm font-bold text-ink dark:text-sink">{j.qty} × {p.name}</Text><Text className="text-xs text-ink-soft dark:text-sink-soft">{RESTOCK_STAGES[j.stage]} · {timeAgo(j.createdAt)}</Text></View>
              </View>
            );
          })}
        </>
      )}

      <Text className="mb-3 mt-6 text-lg font-extrabold text-ink dark:text-sink">Stocked now</Text>
      <FlatList
        data={stocked} keyExtractor={([pid]) => pid} scrollEnabled={false}
        ListEmptyComponent={<EmptyState icon="layers-outline" title="Your shelf is empty" body="Restock from a wholesaler to start selling retail from here." cta="Restock now" onCta={() => nav.navigate('Restock')} />}
        renderItem={({ item: [pid, qty] }) => {
          const p = PRODUCTS.find((x) => x.id === pid)!;
          return (
            <View className="mb-3 flex-row items-center rounded-2xl border border-line dark:border-surface-line bg-white dark:bg-surface p-3">
              <View className="h-12 w-12 overflow-hidden rounded-xl"><ProductImage product={p} height={48} artSize={32} /></View>
              <View className="ml-3 flex-1"><Text className="text-sm font-bold text-ink dark:text-sink">{p.name}</Text><Text className="text-xs text-ink-soft dark:text-sink-soft">{qty} units on your shelf</Text></View>
            </View>
          );
        }}
      />
      <Button title="Restock from a wholesaler" icon="cube-outline" variant="outline" className="mt-2" onPress={() => nav.navigate('Restock')} />
    </Screen>
  );
}
