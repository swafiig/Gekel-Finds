import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, Share, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useRoute } from '@react-navigation/native';
import ProductImage from '../../components/ProductImage';
import Button from '../../components/Button';
import OnlineStatus from '../../components/OnlineStatus';
import { FlashBanner } from '../../components/FlashTimer';
import { modeFor, unitPriceFor, useAppData } from '../../context/AppDataContext';
import { PRODUCTS, SELLER_LABEL, SUPPLIERS, formatKsh } from '../../data/mock';
import { useNav } from '../../hooks/useNav';
import type { RootStackParamList } from '../../types/navigation';

export default function ProductDetailScreen() {
  const nav = useNav();
  const { id } = useRoute<RouteProp<RootStackParamList, 'ProductDetail'>>().params;
  const { favorites, toggleFavorite, openSupplierChat, addToCart, cart } = useAppData();
  const product = PRODUCTS.find((p) => p.id === id)!;
  const supplier = SUPPLIERS.find((s) => s.id === product.supplierId)!;
  const fav = favorites.includes(id);
  const [qty, setQty] = useState(1);
  const [joined, setJoined] = useState(false);

  const w = supplier.type !== 'retail' ? product.wholesale : undefined;
  const unit = unitPriceFor(id, qty);
  const items = unit * qty;
  const isWholesale = modeFor(id, qty) === 'wholesale';
  const typical = product.oldPrice ?? Math.round(product.price * 1.3);
  const savePct = Math.round(((typical - unit) / typical) * 100);
  const chamaHave = joined ? 7 + 1 : 7; // mock pool
  const chamaNeed = w?.minQty ?? 0;

  const inviteFriends = () => Share.share({ message: `Join my Chama Buy on GEKEL: ${product.name} at ${formatKsh(w!.unitPrice)} each when we reach ${chamaNeed}. ${chamaNeed - chamaHave} more to go!` });

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        <View>
          <ProductImage product={product} height={290} artSize={190} />
          <Pressable onPress={() => nav.goBack()} accessibilityLabel="Go back" className="absolute left-4 top-3 h-10 w-10 items-center justify-center rounded-full bg-white/90"><Ionicons name="arrow-back" size={20} color="#1C1917" /></Pressable>
          <Pressable onPress={() => toggleFavorite(id)} accessibilityLabel="Save" className="absolute right-16 top-3 h-10 w-10 items-center justify-center rounded-full bg-white/90"><Ionicons name={fav ? 'heart' : 'heart-outline'} size={20} color={fav ? '#F44236' : '#1C1917'} /></Pressable>
          <Pressable onPress={() => nav.navigate('Cart')} accessibilityLabel="Cart" className="absolute right-4 top-3 h-10 w-10 items-center justify-center rounded-full bg-white/90"><Ionicons name="cart-outline" size={20} color="#1C1917" />{cart.length > 0 && <View className="absolute -right-1 -top-1 h-4 min-w-[16px] items-center justify-center rounded-full bg-brand-500 px-1"><Text className="text-[10px] font-bold text-white">{cart.length}</Text></View>}</Pressable>
        </View>

        <View className="px-5 pt-5">
          {product.flashEndsAt ? <FlashBanner endsAt={product.flashEndsAt} /> : null}
          <Text className="text-xs text-ink-mute">{product.category}</Text>
          <Text className="mt-1 text-2xl font-extrabold text-ink">{product.name}</Text>
          <View className="mt-1 flex-row items-end">
            <Text className="text-2xl font-extrabold text-brand-600">{formatKsh(product.price)}</Text>
            {product.oldPrice ? <Text className="mb-0.5 ml-2 text-base text-ink-mute line-through">{formatKsh(product.oldPrice)}</Text> : null}
          </View>
          <Text className="mt-3 text-base leading-6 text-ink-soft">{product.description}</Text>

          {/* Bei Poa */}
          <View className="mt-5 rounded-2xl border border-line bg-cream p-4">
            <View className="flex-row items-center justify-between"><Text className="text-sm font-extrabold text-ink">Bei Poa meter</Text><Text className="text-xs font-bold text-success">{savePct > 0 ? `${savePct}% below shop price` : 'Fair market price'}</Text></View>
            <View className="mt-3 h-3 overflow-hidden rounded-full bg-line"><View style={{ width: `${Math.min(100, Math.max(15, (unit / typical) * 100))}%` }} className="h-full rounded-full bg-success" /></View>
            <View className="mt-1.5 flex-row justify-between"><Text className="text-xs text-ink-soft">GEKEL {formatKsh(unit)}</Text><Text className="text-xs text-ink-soft">Usual shop {formatKsh(typical)}</Text></View>
          </View>

          {/* supplier */}
          <Pressable onPress={() => nav.navigate('SupplierProfile', { id: supplier.id })} className="mt-4 flex-row items-center rounded-2xl border border-line p-3 active:bg-cream">
            <View className="h-11 w-11 items-center justify-center rounded-full bg-brand-50"><Ionicons name="storefront" size={20} color="#F44236" /></View>
            <View className="ml-3 flex-1">
              <View className="flex-row items-center"><Text numberOfLines={1} className="shrink text-base font-bold text-ink">{supplier.name}</Text>{supplier.verified && <Ionicons name="shield-checkmark" size={14} color="#15803D" style={{ marginLeft: 6 }} />}</View>
              <Text className="text-sm text-ink-soft">★ {supplier.rating} ({supplier.reviewCount}) · {SELLER_LABEL[supplier.type]}</Text>
              <View className="mt-0.5"><OnlineStatus online={supplier.online} lastSeen={supplier.lastSeen} /></View>
            </View>
            <Pressable hitSlop={10} onPress={() => nav.navigate('ChatRoom', { id: openSupplierChat(supplier.id) })} accessibilityLabel="Message supplier"><Ionicons name="chatbubble-ellipses-outline" size={22} color="#F44236" /></Pressable>
          </Pressable>

          {/* quantity + tiers */}
          <View className="mt-5 flex-row items-center justify-between">
            <Text className="text-base font-semibold text-ink">Quantity</Text>
            <View className="flex-row items-center">
              <Pressable disabled={qty <= 1} onPress={() => setQty(qty - 1)} accessibilityLabel="Decrease" className={`h-10 w-10 items-center justify-center rounded-full border border-line ${qty <= 1 ? 'opacity-40' : ''}`}><Ionicons name="remove" size={18} color="#1C1917" /></Pressable>
              <Text className="w-12 text-center text-lg font-bold text-ink">{qty}</Text>
              <Pressable onPress={() => setQty(qty + 1)} accessibilityLabel="Increase" className="h-10 w-10 items-center justify-center rounded-full bg-brand-500"><Ionicons name="add" size={18} color="#fff" /></Pressable>
            </View>
          </View>
          {w && (
            <Pressable onPress={() => setQty(Math.max(qty, w.minQty))} className={`mt-3 flex-row items-center rounded-2xl p-3 ${isWholesale ? 'bg-green-50' : 'bg-brand-50'}`}>
              <Ionicons name="layers" size={18} color={isWholesale ? '#15803D' : '#F44236'} />
              <Text className="ml-2 flex-1 text-sm text-ink">{isWholesale ? `Wholesale price applied: ${formatKsh(w.unitPrice)} each. You save ${formatKsh((product.price - w.unitPrice) * qty)}.` : `Buy ${w.minQty}+ for ${formatKsh(w.unitPrice)} each. Tap to jump to ${w.minQty}.`}</Text>
            </Pressable>
          )}

          {/* Chama Buy */}
          {w && (
            <View className="mt-4 rounded-2xl border border-line bg-white p-4">
              <View className="flex-row items-center"><Ionicons name="people" size={18} color="#F44236" /><Text className="ml-2 text-base font-extrabold text-ink">Chama Buy</Text><View className="ml-2 rounded-full bg-brand-50 px-2 py-0.5"><Text className="text-[10px] font-bold text-brand-600">NEW</Text></View></View>
              <Text className="mt-1 text-sm leading-5 text-ink-soft">Not enough for wholesale? Pool with friends, neighbours or your chama. When the group hits {chamaNeed} pieces everyone gets {formatKsh(w.unitPrice)} each.</Text>
              <View className="mt-3 h-2.5 overflow-hidden rounded-full bg-line"><View style={{ width: `${(chamaHave / chamaNeed) * 100}%` }} className="h-full rounded-full bg-brand-500" /></View>
              <Text className="mt-1.5 text-xs font-semibold text-ink-soft">{chamaHave} of {chamaNeed} joined · {chamaNeed - chamaHave} to go · closes in 2 days</Text>
              <View className="mt-3 flex-row gap-3">
                <Button title={joined ? 'You are in ✓' : 'Join the pool'} variant={joined ? 'outline' : 'primary'} disabled={joined} className="h-11 flex-1" onPress={() => { setJoined(true); Alert.alert('You are in!', 'We will notify you when the group reaches the wholesale minimum.'); }} />
                <Button title="Invite" icon="share-social-outline" variant="outline" className="h-11 w-28" onPress={inviteFriends} />
              </View>
            </View>
          )}

          <View className="mt-5 gap-3">
            {[['shield-checkmark', 'Inspected and sealed with serialized tape'], ['camera', 'Photo proof from the stall and from the rider'], ['flash', product.sameDay ? 'Same-day delivery in Nairobi' : 'Delivered within 3 days']].map(([i, t]) => (
              <View key={t} className="flex-row items-center"><Ionicons name={i as any} size={18} color="#F44236" /><Text className="ml-3 flex-1 text-sm text-ink">{t}</Text></View>
            ))}
          </View>
        </View>
      </ScrollView>

      <View className="flex-row gap-3 border-t border-line bg-white px-5 pt-3">
        <Button title="Add to cart" icon="cart-outline" variant="outline" className="h-14 flex-1" onPress={() => { addToCart(id, qty); Alert.alert('Added to cart', `${qty} × ${product.name}`, [{ text: 'Keep browsing', style: 'cancel' }, { text: 'View cart', onPress: () => nav.navigate('Cart') }]); }} />
        <Button title={`Order · ${formatKsh(items)}`} className="h-14 flex-[1.4]" onPress={() => nav.navigate('Checkout', { lines: [{ productId: id, qty }] })} />
      </View>
    </SafeAreaView>
  );
}
