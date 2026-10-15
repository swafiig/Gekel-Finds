import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useRoute } from '@react-navigation/native';
import Button from '../../components/Button';
import { SafeAreaView } from 'react-native-safe-area-context';
import Chip from '../../components/Chip';
import ProductCard from '../../components/ProductCard';
import EmptyState from '../../components/EmptyState';
import { useAppData } from '../../context/AppDataContext';
import { CATEGORIES, PRODUCTS } from '../../data/mock';
import { useNav } from '../../hooks/useNav';
import type { MainTabParamList } from '../../types/navigation';

export default function FindsScreen() {
  const nav = useNav();
  const params = useRoute<RouteProp<MainTabParamList, 'Finds'>>().params;
  const { width } = useWindowDimensions();
  const { favorites, addToCart, cart } = useAppData();
  const [q, setQ] = useState(params?.q ?? '');
  const [cat, setCat] = useState<string | undefined>(params?.cat);
  const [savedOnly, setSavedOnly] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const selecting = picked.length > 0;
  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const addPicked = () => { picked.forEach((id) => addToCart(id, 1)); setPicked([]); nav.navigate('Cart'); };

  const cardW = (width - 20 * 2 - 12) / 2;
  const data = useMemo(
    () => PRODUCTS.filter((p) => (!cat || p.category === cat) && (!savedOnly || favorites.includes(p.id)) && p.name.toLowerCase().includes(q.trim().toLowerCase())),
    [q, cat, savedOnly, favorites],
  );
  const askPrefill = q.trim() ? `Can't find "${q.trim()}" — can GEKEL look for it?` : undefined;

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-surface" edges={['top']}>
      <View className="flex-row items-center justify-between px-5 pt-3">
        <Text className="text-[28px] font-extrabold text-ink dark:text-sink">{selecting ? `${picked.length} selected` : 'Search'}</Text>
        {selecting ? <Pressable hitSlop={8} onPress={() => setPicked([])}><Text className="text-base font-bold text-brand-600">Cancel</Text></Pressable> : (
          <Pressable onPress={() => nav.navigate('Cart')} hitSlop={8} accessibilityLabel="Cart" className="h-10 w-10 items-center justify-center rounded-full border border-line dark:border-surface-line"><Ionicons name="cart-outline" size={20} color="#1C1917" />{cart.length > 0 && <View className="absolute -right-1 -top-1 h-4 min-w-[16px] items-center justify-center rounded-full bg-brand-500 px-1"><Text className="text-[10px] font-bold text-white">{cart.length}</Text></View>}</Pressable>
        )}
      </View>
      {!selecting && <Text className="px-5 pt-1 text-xs text-ink-mute dark:text-sink-mute">Tip: press and hold items to pick many and order in bulk.</Text>}
      <View className="mx-5 mt-3 h-12 flex-row items-center rounded-2xl bg-cream dark:bg-surface-soft px-4">
        <Ionicons name="search" size={18} color="#A8A29E" />
        <TextInput className="ml-3 flex-1 text-base text-ink dark:text-sink" placeholder="What are you looking for?" placeholderTextColor="#A8A29E" value={q} onChangeText={setQ} />
        {q.length > 0 && <Pressable hitSlop={8} onPress={() => setQ('')}><Ionicons name="close-circle" size={18} color="#A8A29E" /></Pressable>}
      </View>
      <View className="my-3 max-h-12">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20 }}>
          <Chip label="Saved ♥" active={savedOnly} onPress={() => setSavedOnly((s) => !s)} />
          <Chip label="All" active={!cat} onPress={() => setCat(undefined)} />
          {CATEGORIES.map((c) => <Chip key={c.id} label={c.name} active={cat === c.id} onPress={() => setCat(cat === c.id ? undefined : c.id)} />)}
        </ScrollView>
      </View>
      <FlatList
        data={data}
        numColumns={2}
        keyExtractor={(p) => p.id}
        showsVerticalScrollIndicator={false}
        columnWrapperStyle={{ gap: 12, paddingHorizontal: 20 }}
        contentContainerStyle={{ gap: 12, paddingBottom: 24 }}
        ListEmptyComponent={
          <EmptyState
            icon="search"
            title={savedOnly ? 'Nothing saved yet' : "Can't find it here"}
            body={savedOnly ? 'Save finds you like and they will show up here.' : 'Let GEKEL look for you in the markets — we usually find it within 3 days.'}
            cta="Ask GEKEL to find it"
            onCta={() => nav.navigate('AskGekel', askPrefill ? { prefill: q.trim() } : undefined)}
          />
        }
        renderItem={({ item }) => <ProductCard item={item} width={cardW} imageHeight={120} selectMode={selecting} selected={picked.includes(item.id)} onLongPress={() => toggle(item.id)} onPress={() => (selecting ? toggle(item.id) : nav.navigate('ProductDetail', { id: item.id }))} />}
      />
      {selecting && <View className="border-t border-line dark:border-surface-line bg-white dark:bg-surface px-5 pb-3 pt-3"><Button title={`Add ${picked.length} to cart`} icon="cart-outline" onPress={addPicked} /></View>}
    </SafeAreaView>
  );
}
