import React, { useMemo, useState } from 'react';
import { FlatList, ScrollView, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../../components/Screen';
import BackHeader from '../../components/BackHeader';
import Chip from '../../components/Chip';
import Button from '../../components/Button';
import EmptyState from '../../components/EmptyState';
import { MARKETS, SUPPLIERS } from '../../data/mock';
import { useNav } from '../../hooks/useNav';

export default function SuppliersScreen() {
  const nav = useNav();
  const [q, setQ] = useState('');
  const [market, setMarket] = useState<string>();

  const data = useMemo(
    () => SUPPLIERS.filter((s) => (!market || s.market === market) && (s.name + s.categories.join(' ')).toLowerCase().includes(q.trim().toLowerCase())),
    [q, market],
  );

  return (
    <Screen>
      <BackHeader title="Suppliers" />
      <View className="mt-3 h-12 flex-row items-center rounded-2xl bg-white px-4 border border-line">
        <Ionicons name="search" size={18} color="#A8A29E" />
        <TextInput className="ml-3 flex-1 text-base text-ink" placeholder="Search suppliers or categories" placeholderTextColor="#A8A29E" value={q} onChangeText={setQ} />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="my-4 -mx-6 max-h-12" contentContainerStyle={{ paddingHorizontal: 24 }}>
        <Chip label="All" active={!market} onPress={() => setMarket(undefined)} />
        {MARKETS.map((m) => <Chip key={m} label={m} active={market === m} onPress={() => setMarket(market === m ? undefined : m)} />)}
      </ScrollView>
      <FlatList
        data={data}
        keyExtractor={(s) => s.id}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={<EmptyState icon="storefront-outline" title="No suppliers found" body="Try another market or ask GEKEL to find it for you." cta="Ask GEKEL" onCta={() => nav.replace('AskGekel')} />}
        renderItem={({ item }) => (
          <View className="mb-3 rounded-2xl border border-line bg-white p-4">
            <View className="flex-row items-center">
              <View className="h-12 w-12 items-center justify-center rounded-full bg-brand-50"><Ionicons name="storefront" size={22} color="#E8590C" /></View>
              <View className="ml-3 flex-1">
                <View className="flex-row items-center">
                  <Text className="text-base font-bold text-ink">{item.name}</Text>
                  {item.verified && <Ionicons name="shield-checkmark" size={14} color="#15803D" style={{ marginLeft: 6 }} />}
                </View>
                <Text className="text-sm text-ink-soft">{item.market} · ★ {item.rating}</Text>
              </View>
            </View>
            <View className="mt-3 flex-row flex-wrap gap-2">
              {item.categories.map((c) => <View key={c} className="rounded-full bg-cream px-2.5 py-1"><Text className="text-xs font-semibold text-ink-soft">{c}</Text></View>)}
              {item.sameDay && <View className="rounded-full bg-green-50 px-2.5 py-1"><Text className="text-xs font-semibold text-success">Same day</Text></View>}
            </View>
            <Button title="Ask for an item" variant="outline" className="mt-3 h-11" onPress={() => nav.replace('AskGekel')} />
          </View>
        )}
      />
    </Screen>
  );
}
