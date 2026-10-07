import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../components/Button';
import ProductCard from '../../components/ProductCard';
import Skeleton from '../../components/Skeleton';
import { useAuth } from '../../context/AuthContext';
import { useAppData, requestNote, requestStatus } from '../../context/AppDataContext';
import { PRODUCTS, ORDER_STAGES, formatKsh } from '../../data/mock';
import { useNav } from '../../hooks/useNav';

export default function HomeScreen() {
  const nav = useNav();
  const { user } = useAuth();
  const { requests, orders, unreadNotifications } = useAppData();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(() => { const t = setTimeout(() => setLoading(false), 700); return () => clearTimeout(t); }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // TODO: refetch finds, requests, orders
    await new Promise((r) => setTimeout(r, 800));
    setRefreshing(false);
  }, []);

  const search = () => (query.trim() ? nav.navigate('Main', { screen: 'Finds' }) : nav.navigate('AskGekel'));
  const activeRequests = requests.filter((r) => requestStatus(r) !== 'Cancelled' && requestStatus(r) !== 'Delivered').slice(0, 2);
  const inTransit = orders.find((o) => o.stage < 3);
  const forYou = PRODUCTS.filter((p) => p.badge);
  const sameDay = PRODUCTS.filter((p) => p.sameDay && !p.badge);

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#E8590C" colors={['#E8590C']} />}
        contentContainerStyle={{ paddingBottom: 28 }}
      >
        {/* header */}
        <View className="flex-row items-center justify-between px-5 pt-2">
          <Text className="text-base text-ink">
            {greeting}, <Text className="font-bold">{user?.name ?? 'there'}</Text> 👋
          </Text>
          <View className="flex-row items-center">
            <Pressable className="mr-2 flex-row items-center rounded-full border border-line px-3 py-1.5" accessibilityLabel="Change city">
              <Ionicons name="location" size={13} color="#E8590C" />
              <Text className="mx-1 text-sm font-semibold text-ink">Nairobi</Text>
              <Ionicons name="chevron-down" size={13} color="#57534E" />
            </Pressable>
            <Pressable onPress={() => nav.navigate('Notifications')} hitSlop={8} accessibilityLabel="Notifications" className="h-9 w-9 items-center justify-center rounded-full border border-line">
              <Ionicons name="notifications-outline" size={18} color="#1C1917" />
              {unreadNotifications > 0 && <View className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-brand-500" />}
            </Pressable>
          </View>
        </View>

        {/* search */}
        <View className="mx-5 mt-4 h-12 flex-row items-center rounded-2xl bg-cream px-4">
          <Ionicons name="search" size={18} color="#A8A29E" />
          <TextInput
            className="ml-3 flex-1 text-base text-ink"
            placeholder="What are you looking for?"
            placeholderTextColor="#A8A29E"
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
            onSubmitEditing={search}
          />
          {query.length > 0 && (
            <Pressable hitSlop={8} onPress={() => setQuery('')}><Ionicons name="close-circle" size={18} color="#A8A29E" /></Pressable>
          )}
        </View>

        {/* actions */}
        <View className="mt-4 flex-row gap-3 px-5">
          <Button title="Ask GEKEL" className="h-12 flex-1" onPress={() => nav.navigate('AskGekel')} />
          <Button title="Browse Suppliers" variant="outline" className="h-12 flex-1 px-3" onPress={() => nav.navigate('Suppliers')} />
        </View>

        {/* live delivery */}
        {inTransit && (
          <Pressable onPress={() => nav.navigate('OrderDetail', { id: inTransit.id })} className="mx-5 mt-5 flex-row items-center rounded-2xl bg-brand-500 p-4 active:opacity-90">
            <View className="h-11 w-11 items-center justify-center rounded-full bg-white/20"><Ionicons name="bicycle" size={22} color="#fff" /></View>
            <View className="ml-3 flex-1">
              <Text className="text-base font-bold text-white">{ORDER_STAGES[inTransit.stage]}</Text>
              <Text className="text-sm text-white/85">{inTransit.etaMinutes > 0 ? `Arriving in about ${inTransit.etaMinutes} min` : 'Track your order'}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#fff" />
          </Pressable>
        )}

        {/* finds for you */}
        <Text className="mb-3 mt-6 px-5 text-xs font-bold tracking-widest text-ink-soft">GEKEL FINDS FOR YOU</Text>
        {loading ? (
          <View className="flex-row gap-3 px-5">{[0, 1].map((i) => <Skeleton key={i} width={170} height={190} radius={16} />)}</View>
        ) : (
          <FlatList
            horizontal data={forYou} keyExtractor={(i) => i.id} showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
            renderItem={({ item }) => <ProductCard item={item} width={172} imageHeight={118} onPress={() => nav.navigate('ProductDetail', { id: item.id })} />}
          />
        )}

        {/* requests */}
        <Text className="mb-3 mt-6 px-5 text-xs font-bold tracking-widest text-ink-soft">YOUR REQUESTS</Text>
        {loading ? (
          <View className="px-5"><Skeleton height={86} radius={16} /></View>
        ) : activeRequests.length === 0 ? (
          <Pressable onPress={() => nav.navigate('AskGekel')} className="mx-5 items-center rounded-2xl border border-dashed border-line p-6">
            <Text className="text-base font-semibold text-ink">No active requests</Text>
            <Text className="mt-1 text-center text-sm text-ink-soft">Tell GEKEL what you need and we start searching.</Text>
          </Pressable>
        ) : (
          activeRequests.map((r) => (
            <Pressable key={r.id} onPress={() => nav.navigate('RequestDetail', { id: r.id })} className="mx-5 mb-3 rounded-2xl border border-line bg-white p-4 active:bg-cream">
              <View className="flex-row items-start justify-between">
                <Text className="flex-1 pr-3 text-base font-bold text-ink">{r.title}</Text>
                <View className="rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5">
                  <Text className="text-xs font-semibold text-amber-700">{requestStatus(r)}</Text>
                </View>
              </View>
              <View className="mt-2 flex-row items-center">
                <View className="mr-2 h-1.5 w-1.5 rounded-full bg-brand-500" />
                <Text className="text-sm text-ink-soft">{requestNote(r)}</Text>
              </View>
              <View className="mt-3 h-1.5 overflow-hidden rounded-full bg-brand-100">
                <View style={{ width: `${Math.max(8, ((r.stage + 1) / 6) * 100)}%` }} className="h-full rounded-full bg-brand-500" />
              </View>
            </Pressable>
          ))
        )}

        {/* same day */}
        <View className="mb-3 mt-5 flex-row items-center justify-between px-5">
          <Text className="text-lg font-bold text-ink">Same Day in Nairobi</Text>
          <Pressable hitSlop={8} onPress={() => nav.navigate('Main', { screen: 'Finds' })}>
            <Text className="text-sm font-semibold text-brand-600">See all</Text>
          </Pressable>
        </View>
        {loading ? (
          <View className="flex-row gap-3 px-5">{[0, 1, 2].map((i) => <Skeleton key={i} width={140} height={160} radius={16} />)}</View>
        ) : (
          <FlatList
            horizontal data={sameDay} keyExtractor={(i) => i.id} showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
            renderItem={({ item }) => <ProductCard item={item} width={142} imageHeight={92} priceAccent onPress={() => nav.navigate('ProductDetail', { id: item.id })} />}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
