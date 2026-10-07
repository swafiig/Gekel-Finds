import React, { useMemo, useState } from 'react';
import { FlatList, ScrollView, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import Chip from '../../components/Chip';
import ProductCard from '../../components/ProductCard';
import EmptyState from '../../components/EmptyState';
import { useAppData } from '../../context/AppDataContext';
import { CATEGORIES, PRODUCTS } from '../../data/mock';
import { useNav } from '../../hooks/useNav';

export default function FindsScreen() {
  const nav = useNav();
  const { width } = useWindowDimensions();
  const { favorites } = useAppData();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<string>();
  const [savedOnly, setSavedOnly] = useState(false);

  const cardW = (width - 20 * 2 - 12) / 2;
  const data = useMemo(
    () => PRODUCTS.filter((p) => (!cat || p.category === cat) && (!savedOnly || favorites.includes(p.id)) && p.name.toLowerCase().includes(q.trim().toLowerCase())),
    [q, cat, savedOnly, favorites],
  );

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <Text className="px-5 pt-3 text-[28px] font-extrabold text-ink">Finds</Text>
      <View className="mx-5 mt-3 h-12 flex-row items-center rounded-2xl bg-cream px-4">
        <Ionicons name="search" size={18} color="#A8A29E" />
        <TextInput className="ml-3 flex-1 text-base text-ink" placeholder="Search finds" placeholderTextColor="#A8A29E" value={q} onChangeText={setQ} />
      </View>
      <View className="my-3 max-h-12">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20 }}>
          <Chip label="Saved ♥" active={savedOnly} onPress={() => setSavedOnly((s) => !s)} />
          <Chip label="All" active={!cat} onPress={() => setCat(undefined)} />
          {CATEGORIES.map((c) => <Chip key={c} label={c} active={cat === c} onPress={() => setCat(cat === c ? undefined : c)} />)}
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
          <EmptyState icon="search" title={savedOnly ? 'Nothing saved yet' : 'No matches'} body="Can't find it? Ask GEKEL and we will search the markets for you." cta="Ask GEKEL" onCta={() => nav.navigate('AskGekel')} />
        }
        renderItem={({ item }) => <ProductCard item={item} width={cardW} imageHeight={120} onPress={() => nav.navigate('ProductDetail', { id: item.id })} />}
      />
    </SafeAreaView>
  );
}
