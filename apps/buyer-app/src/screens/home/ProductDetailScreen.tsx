import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useRoute } from '@react-navigation/native';
import ProductImage from '../../components/ProductImage';
import Button from '../../components/Button';
import { useAppData } from '../../context/AppDataContext';
import { DELIVERY_FEE, PRODUCTS, SUPPLIERS, formatKsh } from '../../data/mock';
import { useNav } from '../../hooks/useNav';
import type { RootStackParamList } from '../../types/navigation';

export default function ProductDetailScreen() {
  const nav = useNav();
  const { id } = useRoute<RouteProp<RootStackParamList, 'ProductDetail'>>().params;
  const { favorites, toggleFavorite } = useAppData();
  const product = PRODUCTS.find((p) => p.id === id)!;
  const supplier = SUPPLIERS.find((s) => s.id === product.supplierId)!;
  const fav = favorites.includes(id);
  const total = product.price + DELIVERY_FEE;

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        <View>
          <ProductImage product={product} height={300} artSize={200} />
          <Pressable onPress={() => nav.goBack()} accessibilityLabel="Go back" className="absolute left-4 top-3 h-10 w-10 items-center justify-center rounded-full bg-white/90">
            <Ionicons name="arrow-back" size={20} color="#1C1917" />
          </Pressable>
          <Pressable onPress={() => toggleFavorite(id)} accessibilityLabel="Save" className="absolute right-4 top-3 h-10 w-10 items-center justify-center rounded-full bg-white/90">
            <Ionicons name={fav ? 'heart' : 'heart-outline'} size={20} color={fav ? '#E8590C' : '#1C1917'} />
          </Pressable>
          {product.badge && (
            <View className="absolute bottom-4 left-4 rounded-md bg-brand-500 px-2.5 py-1"><Text className="text-xs font-bold text-white">{product.badge}</Text></View>
          )}
        </View>

        <View className="px-5 pt-5">
          <Text className="text-xs text-ink-mute">{product.category}</Text>
          <Text className="mt-1 text-2xl font-extrabold text-ink">{product.name}</Text>
          <Text className="mt-1 text-2xl font-extrabold text-brand-600">{formatKsh(product.price)}</Text>
          <Text className="mt-4 text-base leading-6 text-ink-soft">{product.description}</Text>

          <View className="mt-5 flex-row items-center rounded-2xl border border-line p-3">
            <View className="h-11 w-11 items-center justify-center rounded-full bg-brand-50"><Ionicons name="storefront" size={20} color="#E8590C" /></View>
            <View className="ml-3 flex-1">
              <View className="flex-row items-center">
                <Text className="text-base font-bold text-ink">{supplier.name}</Text>
                {supplier.verified && <Ionicons name="shield-checkmark" size={14} color="#15803D" style={{ marginLeft: 6 }} />}
              </View>
              <Text className="text-sm text-ink-soft">{supplier.market} · ★ {supplier.rating}</Text>
            </View>
            <Pressable onPress={() => nav.navigate('ChatRoom', { id: 'c1' })} hitSlop={8} accessibilityLabel="Chat with shopper">
              <Ionicons name="chatbubble-ellipses-outline" size={22} color="#E8590C" />
            </Pressable>
          </View>

          <Text className="mb-3 mt-6 text-lg font-bold text-ink">Price breakdown</Text>
          <View className="rounded-2xl bg-cream p-4">
            <Row label="Item (paid to supplier's Till)" value={formatKsh(product.price)} />
            <Row label="GEKEL delivery fee" value={formatKsh(DELIVERY_FEE)} />
            <View className="my-2 h-px bg-line" />
            <Row label="Total" value={formatKsh(total)} bold />
          </View>

          <View className="mt-5 gap-3">
            {[['shield-checkmark', 'Inspected and sealed with serialized tape'], ['camera', 'Photo proof before it leaves the stall'], ['flash', product.sameDay ? 'Same-day delivery in Nairobi' : 'Delivered within 3 days']].map(([i, t]) => (
              <View key={t} className="flex-row items-center">
                <Ionicons name={i as any} size={18} color="#E8590C" />
                <Text className="ml-3 flex-1 text-sm text-ink">{t}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      <View className="border-t border-line bg-white px-5 pt-3">
        <Button title={`Order now · ${formatKsh(total)}`} onPress={() => nav.navigate('Checkout', { productId: id })} />
      </View>
    </SafeAreaView>
  );
}

const Row = ({ label, value, bold }: { label: string; value: string; bold?: boolean }) => (
  <View className="flex-row items-center justify-between py-1">
    <Text className={`flex-1 pr-3 text-sm ${bold ? 'font-bold text-ink' : 'text-ink-soft'}`}>{label}</Text>
    <Text className={`text-sm ${bold ? 'text-base font-extrabold text-ink' : 'font-semibold text-ink'}`}>{value}</Text>
  </View>
);
