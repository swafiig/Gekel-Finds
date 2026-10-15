import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import ProductCard from '../../components/ProductCard';
import Skeleton from '../../components/Skeleton';
import Avatar from '../../components/Avatar';
import AskGekelButton from '../../components/AskGekelButton';
import AddressSheet from '../../components/AddressSheet';
import { FlashTimer } from '../../components/FlashTimer';
import { useAuth } from '../../context/AuthContext';
import { useUI } from '../../context/UIContext';
import { useAppData, requestNote, requestStatus, isActive, orderStages } from '../../context/AppDataContext';
import { CATEGORIES, GREETINGS, MARKET_STATUS, PRODUCTS, SUPPLIERS } from '../../data/mock';
import { formatKm, haversineKm } from '../../utils/geo';
import { useNav } from '../../hooks/useNav';

const TONE = { red: 'bg-red-500', green: 'bg-green-500', amber: 'bg-amber-400' } as const;

export default function HomeScreen() {
  const nav = useNav();
  const { user, justRegistered, clearJustRegistered } = useAuth();
  const { openMenu } = useUI();
  const { requests, orders, unreadNotifications, avatarUri, cart, defaultAddress, userCoords, locationDenied, requestLocation } = useAppData();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [sheet, setSheet] = useState(false);

  useEffect(() => { const t = setTimeout(() => setLoading(false), 700); return () => clearTimeout(t); }, []);

  // Right after signup the SMS code is already on its way: open the verification screen once.
  useEffect(() => {
    if (justRegistered && user && !user.phoneVerified) { clearJustRegistered(); nav.navigate('VerifyPhone', { autoSend: false }); }
  }, [justRegistered, user, clearJustRegistered, nav]);

  const hour = new Date().getHours();
  const period = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
  const greet = GREETINGS[period][new Date().getDate() % 2];

  const onRefresh = useCallback(async () => { setRefreshing(true); await new Promise((r) => setTimeout(r, 800)); setRefreshing(false); }, []);

  const nearest = useMemo(() => {
    if (!userCoords) return undefined;
    return SUPPLIERS.map((s) => ({ s, km: haversineKm(userCoords, s.location) })).sort((a, b) => a.km - b.km)[0];
  }, [userCoords]);

  const activeRequests = requests.filter((r) => requestStatus(r) !== 'Cancelled' && requestStatus(r) !== 'Delivered').slice(0, 2);
  const inTransit = orders.find((o) => isActive(o) && o.stage >= 1);
  const forYou = PRODUCTS.filter((p) => p.badge);
  const flash = PRODUCTS.filter((p) => p.flashEndsAt);
  const flashEnd = Math.min(...flash.map((p) => p.flashEndsAt!));
  const sameDay = PRODUCTS.filter((p) => p.sameDay && !p.badge);
  const search = () => (query.trim() ? nav.navigate('Main', { screen: 'Finds', params: { q: query.trim() } }) : nav.navigate('AskGekel'));

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-surface" edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 28 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#F44236" colors={['#F44236']} />}
      >
        {/* header */}
        <View className="flex-row items-center px-5 pt-2">
          <Pressable onPress={() => nav.navigate('Main', { screen: 'Profile' })} accessibilityLabel="Open profile" className="rounded-full border-2 border-brand-500 p-0.5">
            <Avatar uri={avatarUri} name={user?.name} size={40} />
          </Pressable>
          <View className="ml-3 flex-1">
            <Text numberOfLines={1} className="text-lg font-extrabold text-ink">{greet}, {user?.name?.split(' ')[0] ?? 'rafiki'} 👋</Text>
            <Pressable onPress={() => setSheet(true)} hitSlop={6} className="flex-row items-center">
              <Ionicons name="location" size={12} color="#F44236" />
              <Text numberOfLines={1} className="ml-1 max-w-[170px] text-xs font-semibold text-ink-soft">{defaultAddress ? `Delivering to ${defaultAddress.area}` : 'Add a delivery address'}</Text>
              <Ionicons name="chevron-down" size={12} color="#57534E" />
            </Pressable>
          </View>
          <IconBtn icon="notifications-outline" dot={unreadNotifications > 0} label="Notifications" onPress={() => nav.navigate('Notifications')} />
          <IconBtn icon="cart-outline" count={cart.length} label="Cart" onPress={() => nav.navigate('Cart')} />
          <IconBtn icon="menu" label="Open menu" onPress={openMenu} />
        </View>

        {/* search */}
        <View className="mx-5 mt-4 h-12 flex-row items-center rounded-2xl bg-cream px-4">
          <Ionicons name="search" size={18} color="#A8A29E" />
          <TextInput className="ml-3 flex-1 text-base text-ink" placeholder="What are you looking for?" placeholderTextColor="#A8A29E" value={query} onChangeText={setQuery} returnKeyType="search" onSubmitEditing={search} />
          {query.length > 0 && <Pressable hitSlop={8} onPress={() => setQuery('')}><Ionicons name="close-circle" size={18} color="#A8A29E" /></Pressable>}
        </View>

        {/* phone verification nudge (disappears once verified) */}
        {user && !user.phoneVerified && (
          <Pressable onPress={() => nav.navigate('VerifyPhone', { autoSend: true })} accessibilityLabel="Verify your phone number" className="mx-5 mt-4 flex-row items-center rounded-2xl bg-amber-50 p-3.5 ">
            <Ionicons name="shield-half-outline" size={22} color="#B7791F" />
            <View className="ml-3 flex-1"><Text className="text-sm font-bold text-ink">Verify your phone number</Text><Text className="text-xs text-ink-soft">Keeps your account safe and lets you recover it.</Text></View>
            <Text className="text-sm font-bold text-amber-800">Verify</Text>
          </Pressable>
        )}

        {/* ask hero */}
        <View className="mx-5 mt-4"><AskGekelButton variant="hero" /></View>

        {/* quick tiles */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-4" contentContainerStyle={{ paddingHorizontal: 20, gap: 10 }}>
          {([
            ['storefront-outline', 'Suppliers', () => nav.navigate('Suppliers')],
            ['people-outline', 'Chama Buy', () => nav.navigate('Main', { screen: 'Finds' })],
            ['briefcase-outline', 'Errands', () => nav.navigate('Errands')],
            ['sparkles-outline', 'Points', () => nav.navigate('Points')],
          ] as const).map(([ic, l, fn]) => (
            <Pressable key={l} onPress={fn} className="h-[72px] w-[84px] items-center justify-center rounded-2xl border border-line dark:border-surface-line bg-white dark:bg-surface active:bg-cream dark:active:bg-surface-soft">
              <Ionicons name={ic} size={22} color="#F44236" /><Text className="mt-1 text-xs font-bold text-ink dark:text-sink">{l}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* categories */}
        <Text className="mb-2 mt-6 px-5 text-xs font-bold tracking-widest text-ink-soft dark:text-sink-soft">BROWSE BY CATEGORY</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 10 }}>
          {CATEGORIES.map((c) => (
            <Pressable key={c.id} onPress={() => nav.navigate('Main', { screen: 'Finds', params: { cat: c.id } })} style={{ backgroundColor: c.color }} className="w-24 items-center rounded-2xl p-3">
              <Ionicons name={c.icon as any} size={22} color="#57534E" />
              <Text numberOfLines={2} className="mt-1.5 text-center text-[11px] font-bold leading-4 text-ink">{c.name}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* soko leo */}
        <View className="mb-2 mt-6 flex-row items-center px-5"><Text className="text-xs font-bold tracking-widest text-ink-soft">SOKO LEO</Text><Text className="ml-2 text-xs text-ink-mute">how the markets look right now</Text></View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 10 }}>
          {MARKET_STATUS.map((m) => (
            <Pressable key={m.name} onPress={() => nav.navigate('Suppliers', { market: m.name })} className="flex-row items-center rounded-full border border-line bg-white px-3.5 py-2 active:bg-cream">
              <View className={`mr-2 h-2.5 w-2.5 rounded-full ${TONE[m.tone]}`} />
              <Text className="text-sm font-bold text-ink">{m.name}</Text><Text className="ml-1.5 text-xs text-ink-soft">{m.status} · till {m.until}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* nearest shop / location prompt */}
        {nearest ? (
          <Pressable onPress={() => nav.navigate('SupplierProfile', { id: nearest.s.id })} className="mx-5 mt-4 flex-row items-center rounded-2xl bg-cream p-3.5 ">
            <View className="h-10 w-10 items-center justify-center rounded-full bg-white"><Ionicons name="navigate" size={18} color="#F44236" /></View>
            <View className="ml-3 flex-1"><Text className="text-xs text-ink-soft">Nearest shop to you</Text><Text className="text-base font-bold text-ink">{nearest.s.name} · {formatKm(nearest.km)}</Text></View>
            <Ionicons name="chevron-forward" size={18} color="#A8A29E" />
          </Pressable>
        ) : !locationDenied ? (
          <Pressable onPress={requestLocation} className="mx-5 mt-4 flex-row items-center rounded-2xl border border-dashed border-brand-400 bg-brand-50 p-3.5">
            <Ionicons name="navigate-circle" size={30} color="#F44236" />
            <View className="ml-3 flex-1"><Text className="text-base font-bold text-ink">Find shops near you</Text><Text className="text-xs text-ink-soft">Allow location to see distances and the nearest market.</Text></View>
            <Text className="text-sm font-bold text-brand-600">Allow</Text>
          </Pressable>
        ) : null}

        {/* live delivery */}
        {inTransit && (
          <Pressable onPress={() => nav.navigate('OrderDetail', { id: inTransit.id })} className="mx-5 mt-4 flex-row items-center rounded-2xl bg-ink p-4 ">
            <View className="h-11 w-11 items-center justify-center rounded-full bg-brand-500"><Ionicons name={inTransit.delivery.method === 'courier' ? 'cube' : 'bicycle'} size={22} color="#fff" /></View>
            <View className="ml-3 flex-1">
              <Text className="text-base font-bold text-white">{orderStages(inTransit)[inTransit.stage]}</Text>
              <Text className="text-sm text-white-75">{inTransit.etaMinutes > 0 && inTransit.delivery.method === 'rider' ? `Arriving in about ${inTransit.etaMinutes} min` : 'Tap to track your order'}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#fff" />
          </Pressable>
        )}

        {/* flash deals */}
        {flash.length > 0 && (
          <>
            <View className="mb-3 mt-6 flex-row items-center justify-between px-5">
              <View className="flex-row items-center"><Ionicons name="flash" size={18} color="#F44236" /><Text className="ml-1 text-lg font-extrabold text-ink">Flash deals</Text></View>
              <FlashTimer endsAt={flashEnd} />
            </View>
            {loading ? <View className="flex-row gap-3 px-5">{[0, 1].map((i) => <Skeleton key={i} width={150} height={180} radius={16} />)}</View> : (
              <FlatList horizontal data={flash} keyExtractor={(i) => i.id} showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
                renderItem={({ item }) => <ProductCard item={item} width={150} imageHeight={104} priceAccent showTimer onPress={() => nav.navigate('ProductDetail', { id: item.id })} />} />
            )}
          </>
        )}

        {/* finds for you */}
        <Text className="mb-3 mt-6 px-5 text-xs font-bold tracking-widest text-ink-soft">GEKEL FINDS FOR YOU</Text>
        {loading ? <View className="flex-row gap-3 px-5">{[0, 1].map((i) => <Skeleton key={i} width={170} height={190} radius={16} />)}</View> : (
          <FlatList horizontal data={forYou} keyExtractor={(i) => i.id} showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
            renderItem={({ item }) => <ProductCard item={item} width={172} imageHeight={118} onPress={() => nav.navigate('ProductDetail', { id: item.id })} />} />
        )}

        {/* requests */}
        <Text className="mb-3 mt-6 px-5 text-xs font-bold tracking-widest text-ink-soft">YOUR REQUESTS</Text>
        {loading ? <View className="px-5"><Skeleton height={86} radius={16} /></View> : activeRequests.length === 0 ? (
          <Pressable onPress={() => nav.navigate('AskGekel')} className="mx-5 items-center rounded-2xl border border-dashed border-line p-6">
            <Text className="text-base font-semibold text-ink">Nothing on the hunt yet</Text>
            <Text className="mt-1 text-center text-sm text-ink-soft">Tell GEKEL what you need and we start searching.</Text>
          </Pressable>
        ) : activeRequests.map((r) => (
          <Pressable key={r.id} onPress={() => nav.navigate('RequestDetail', { id: r.id })} className="mx-5 mb-3 rounded-2xl border border-line bg-white p-4 active:bg-cream">
            <View className="flex-row items-start justify-between">
              <Text className="flex-1 pr-3 text-base font-bold text-ink">{r.title}</Text>
              <View className="rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5"><Text className="text-xs font-semibold text-amber-700">{requestStatus(r)}</Text></View>
            </View>
            <View className="mt-2 flex-row items-center"><View className="mr-2 h-1.5 w-1.5 rounded-full bg-brand-500" /><Text className="text-sm text-ink-soft">{requestNote(r)}</Text></View>
            <View className="mt-3 h-1.5 overflow-hidden rounded-full bg-brand-100"><View style={{ width: `${Math.max(8, ((r.stage + 1) / 6) * 100)}%` }} className="h-full rounded-full bg-brand-500" /></View>
          </Pressable>
        ))}

        {/* same day */}
        <View className="mb-3 mt-5 flex-row items-center justify-between px-5">
          <Text className="text-lg font-extrabold text-ink">Same Day in Nairobi</Text>
          <Pressable hitSlop={8} onPress={() => nav.navigate('Main', { screen: 'Finds' })}><Text className="text-sm font-semibold text-brand-600">See all</Text></Pressable>
        </View>
        {loading ? <View className="flex-row gap-3 px-5">{[0, 1, 2].map((i) => <Skeleton key={i} width={140} height={160} radius={16} />)}</View> : (
          <FlatList horizontal data={sameDay} keyExtractor={(i) => i.id} showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
            renderItem={({ item }) => <ProductCard item={item} width={142} imageHeight={92} priceAccent onPress={() => nav.navigate('ProductDetail', { id: item.id })} />} />
        )}
      </ScrollView>
      <AddressSheet visible={sheet} onClose={() => setSheet(false)} />
    </SafeAreaView>
  );
}

function IconBtn({ icon, onPress, label, dot, count }: { icon: keyof typeof Ionicons.glyphMap; onPress: () => void; label: string; dot?: boolean; count?: number }) {
  return (
    <Pressable onPress={onPress} hitSlop={6} accessibilityLabel={label} className="ml-1.5 h-9 w-9 items-center justify-center rounded-full border border-line">
      <Ionicons name={icon} size={18} color="#1C1917" />
      {dot ? <View className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-brand-500" /> : null}
      {count ? <View className="absolute -right-1 -top-1 h-4 min-w-[16px] items-center justify-center rounded-full bg-brand-500 px-1"><Text className="text-[10px] font-bold text-white">{count}</Text></View> : null}
    </Pressable>
  );
}
