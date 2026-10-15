import React, { useState } from 'react';
import { Alert, Pressable, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../../components/Screen';
import BackHeader from '../../components/BackHeader';
import Button from '../../components/Button';
import ProductImage from '../../components/ProductImage';
import { useAppData } from '../../context/AppDataContext';
import { PRODUCTS, formatKsh } from '../../data/mock';
import { useNav } from '../../hooks/useNav';

/** Order from a wholesaler; our rider collects and shelves it for you — no trip to the market needed. */
export default function RestockScreen() {
  const nav = useNav();
  const { requestRestock } = useAppData();
  const wholesaleItems = PRODUCTS.filter((p) => p.wholesale);
  const [productId, setProductId] = useState(wholesaleItems[0]?.id);
  const [qty, setQty] = useState(String(wholesaleItems[0]?.wholesale?.minQty ?? 10));
  const product = wholesaleItems.find((p) => p.id === productId);

  const submit = () => {
    const q = Number(qty);
    if (!product || !q || q < (product.wholesale?.minQty ?? 1)) return Alert.alert('Check the quantity', `Minimum order is ${product?.wholesale?.minQty} pieces.`);
    requestRestock(product.id, q);
    Alert.alert('Restock requested', 'A rider will collect from the wholesaler and shelve it for you.', [{ text: 'OK', onPress: () => nav.replace('Shelf') }]);
  };

  return (
    <Screen scroll>
      <BackHeader title="Restock" />
      <Text className="mb-5 mt-3 text-sm leading-5 text-ink-soft dark:text-sink-soft">Pick what to restock. Extra pieces beyond what you need right now can stay on your shelf for later orders.</Text>

      <Text className="mb-3 text-sm font-bold text-ink dark:text-sink">Choose an item</Text>
      {wholesaleItems.map((p) => (
        <Pressable key={p.id} onPress={() => { setProductId(p.id); setQty(String(p.wholesale!.minQty)); }} className={`mb-2 flex-row items-center rounded-2xl border p-3 ${productId === p.id ? 'border-brand-500 bg-brand-50' : 'border-line dark:border-surface-line bg-white dark:bg-surface'}`}>
          <View className="h-12 w-12 overflow-hidden rounded-xl"><ProductImage product={p} height={48} artSize={32} /></View>
          <View className="ml-3 flex-1"><Text className="text-sm font-bold text-ink dark:text-sink">{p.name}</Text><Text className="text-xs text-ink-soft dark:text-sink-soft">From {formatKsh(p.wholesale!.unitPrice)} each · min {p.wholesale!.minQty}</Text></View>
          {productId === p.id && <Ionicons name="checkmark-circle" size={20} color="#F44236" />}
        </Pressable>
      ))}

      <Text className="mb-1.5 mt-4 text-sm font-medium text-ink dark:text-sink">How many pieces?</Text>
      <View className="mb-6 h-14 flex-row items-center rounded-2xl border border-line dark:border-surface-line bg-white dark:bg-surface px-4">
        <Ionicons name="cube-outline" size={18} color="#A8A29E" />
        <TextInput value={qty} onChangeText={setQty} keyboardType="number-pad" className="ml-3 flex-1 text-base text-ink dark:text-sink" />
      </View>

      <View className="mb-5 flex-row items-start rounded-2xl bg-brand-50 p-3">
        <Ionicons name="information-circle" size={18} color="#F44236" style={{ marginTop: 1 }} />
        <Text className="ml-3 flex-1 text-sm leading-5 text-ink">A rider collects from the wholesaler and brings it to our sorting centre. You pay the wholesaler directly, plus a small shelving fee per unit.</Text>
      </View>

      <Button title="Request restock" onPress={submit} />
    </Screen>
  );
}
