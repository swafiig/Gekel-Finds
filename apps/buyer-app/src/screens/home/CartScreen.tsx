import React, { useMemo } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import BackHeader from '../../components/BackHeader';
import Button from '../../components/Button';
import EmptyState from '../../components/EmptyState';
import ProductImage from '../../components/ProductImage';
import { modeFor, unitPriceFor, useAppData } from '../../context/AppDataContext';
import { DeliveryChoice, PRODUCTS, SERVICE_FEE, SUPPLIERS, deliveryFee, formatKsh } from '../../data/mock';
import { useNav } from '../../hooks/useNav';

const STD: DeliveryChoice = { method: 'rider', speed: 'standard', dest: 'door', pay: 'later' };

/** Lines from many shops live in one cart. Wholesale prices apply automatically when a line reaches the minimum. */
export default function CartScreen() {
  const nav = useNav();
  const { cart, setCartQty, removeFromCart, toggleCartSelect, selectAllCart } = useAppData();

  const groups = useMemo(() => {
    const m = new Map<string, typeof cart>();
    cart.forEach((l) => { const sid = PRODUCTS.find((p) => p.id === l.productId)!.supplierId; m.set(sid, [...(m.get(sid) ?? []), l]); });
    return [...m.entries()];
  }, [cart]);

  const picked = cart.filter((l) => l.selected);
  const items = picked.reduce((n, l) => n + unitPriceFor(l.productId, l.qty) * l.qty, 0);
  const stops = new Set(picked.map((l) => PRODUCTS.find((p) => p.id === l.productId)!.supplierId)).size;
  const fee = stops ? deliveryFee(STD, stops) : 0;
  const allOn = cart.length > 0 && picked.length === cart.length;

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={['top', 'bottom']}>
      <View className="px-6"><BackHeader title="My cart" right={cart.length ? <Pressable hitSlop={8} onPress={() => selectAllCart(!allOn)}><Text className="text-sm font-bold text-brand-600">{allOn ? 'Clear' : 'Select all'}</Text></Pressable> : undefined} /></View>
      {cart.length === 0 ? (
        <View className="flex-1 justify-center"><EmptyState icon="cart-outline" title="Your cart is empty" body="Long-press items in Search to pick many at once, or add from any product." cta="Browse finds" onCta={() => nav.navigate('Main', { screen: 'Finds' })} /></View>
      ) : (
        <>
          <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 16 }}>
            {groups.length > 1 && (
              <View className="mb-3 flex-row items-center rounded-2xl bg-brand-50 p-3"><Ionicons name="git-merge" size={18} color="#F44236" /><Text className="ml-2 flex-1 text-sm text-ink">Items from {groups.length} shops are combined: one delivery, one rider trip, each shop paid on its own.</Text></View>
            )}
            {groups.map(([sid, lines]) => {
              const s = SUPPLIERS.find((x) => x.id === sid)!;
              return (
                <View key={sid} className="mb-4 overflow-hidden rounded-2xl border border-line bg-white">
                  <View className="flex-row items-center border-b border-line bg-cream px-4 py-2.5"><Ionicons name="storefront" size={16} color="#F44236" /><Text className="ml-2 flex-1 text-sm font-bold text-ink">{s.name}</Text><Text className="text-xs text-ink-soft">Till {s.till}</Text></View>
                  {lines.map((l) => {
                    const p = PRODUCTS.find((x) => x.id === l.productId)!;
                    const unit = unitPriceFor(l.productId, l.qty);
                    const wholesale = modeFor(l.productId, l.qty) === 'wholesale';
                    const need = p.wholesale && s.type !== 'retail' && !wholesale ? p.wholesale.minQty - l.qty : 0;
                    return (
                      <View key={l.productId} className="border-b border-line px-4 py-3">
                        <View className="flex-row items-center">
                          <Pressable onPress={() => toggleCartSelect(l.productId)} accessibilityRole="checkbox" accessibilityState={{ checked: l.selected }} hitSlop={8} className={`mr-3 h-6 w-6 items-center justify-center rounded-md border-2 ${l.selected ? 'border-brand-500 bg-brand-500' : 'border-line bg-white'}`}>{l.selected && <Ionicons name="checkmark" size={16} color="#fff" />}</Pressable>
                          <View className="h-16 w-16 overflow-hidden rounded-xl"><ProductImage product={p} height={64} artSize={44} /></View>
                          <View className="ml-3 flex-1">
                            <Text numberOfLines={1} className="text-base font-bold text-ink">{p.name}</Text>
                            <Text className="text-sm text-ink-soft">{formatKsh(unit)} each{wholesale ? ' · wholesale' : ''}</Text>
                            <Text className="text-sm font-extrabold text-ink">{formatKsh(unit * l.qty)}</Text>
                          </View>
                          <View className="items-end">
                            <View className="flex-row items-center">
                              <Pressable onPress={() => setCartQty(l.productId, l.qty - 1)} accessibilityLabel="Decrease" className="h-8 w-8 items-center justify-center rounded-full border border-line"><Ionicons name={l.qty === 1 ? 'trash-outline' : 'remove'} size={16} color="#1C1917" /></Pressable>
                              <Text className="w-9 text-center text-base font-bold text-ink">{l.qty}</Text>
                              <Pressable onPress={() => setCartQty(l.productId, l.qty + 1)} accessibilityLabel="Increase" className="h-8 w-8 items-center justify-center rounded-full bg-brand-500"><Ionicons name="add" size={16} color="#fff" /></Pressable>
                            </View>
                          </View>
                        </View>
                        {need > 0 && (
                          <Pressable onPress={() => setCartQty(l.productId, l.qty + need)} className="mt-2 flex-row items-center self-start rounded-full bg-green-50 px-3 py-1.5">
                            <Ionicons name="pricetag" size={12} color="#15803D" /><Text className="ml-1.5 text-xs font-bold text-success">Add {need} more for {formatKsh(p.wholesale!.unitPrice)} each</Text>
                          </Pressable>
                        )}
                      </View>
                    );
                  })}
                </View>
              );
            })}
          </ScrollView>
          <View className="border-t border-line bg-white px-5 pb-2 pt-3">
            <View className="mb-1 flex-row justify-between"><Text className="text-sm text-ink-soft">Items ({picked.length})</Text><Text className="text-sm font-semibold text-ink">{formatKsh(items)}</Text></View>
            <View className="mb-1 flex-row justify-between"><Text className="text-sm text-ink-soft">Delivery from · {stops} shop{stops === 1 ? '' : 's'}</Text><Text className="text-sm font-semibold text-ink">{formatKsh(fee)}</Text></View>
            <View className="mb-3 flex-row justify-between"><Text className="text-sm text-ink-soft">GEKEL service fee</Text><Text className="text-sm font-semibold text-ink">{formatKsh(picked.length ? SERVICE_FEE : 0)}</Text></View>
            <Button title={picked.length ? `Checkout · ${picked.length} item${picked.length === 1 ? '' : 's'}` : 'Select items to checkout'} disabled={!picked.length} onPress={() => nav.navigate('Checkout', { lines: picked.map((l) => ({ productId: l.productId, qty: l.qty })), fromCart: true })} />
          </View>
        </>
      )}
    </SafeAreaView>
  );
}
