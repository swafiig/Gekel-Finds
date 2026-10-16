import React, { useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useRoute } from '@react-navigation/native';
import Screen from '../../components/Screen';
import BackHeader from '../../components/BackHeader';
import Button from '../../components/Button';
import { useAppData } from '../../context/AppDataContext';
import { PRODUCTS, formatKsh } from '../../data/mock';
import { useNav } from '../../hooks/useNav';
import type { RootStackParamList } from '../../types/navigation';

function Option({ active, title, body, icon, onPress }: { active: boolean; title: string; body: string; icon: keyof typeof Ionicons.glyphMap; onPress: () => void }) {
  return (
    <View onTouchEnd={onPress} className={`mb-3 flex-row items-center rounded-2xl border p-3.5 ${active ? 'border-brand-500 bg-brand-50' : 'border-line dark:border-surface-line bg-white dark:bg-surface'}`}>
      <View className={`h-10 w-10 items-center justify-center rounded-full ${active ? 'bg-brand-500' : 'bg-cream dark:bg-surface-soft'}`}><Ionicons name={icon} size={18} color={active ? '#fff' : '#57534E'} /></View>
      <View className="ml-3 flex-1"><Text className="text-base font-bold text-ink dark:text-sink">{title}</Text><Text className="text-sm text-ink-soft dark:text-sink-soft">{body}</Text></View>
      <View className={`h-5 w-5 items-center justify-center rounded-full border-2 ${active ? 'border-brand-500' : 'border-line dark:border-surface-line'}`}>{active && <View className="h-2.5 w-2.5 rounded-full bg-brand-500" />}</View>
    </View>
  );
}

/** Step 1: pick how the group will pay. You add members and quantities on the next screen. */
export default function ChamaCreateScreen() {
  const nav = useNav();
  const { productId } = useRoute<RouteProp<RootStackParamList, 'ChamaCreate'>>().params;
  const { createChama } = useAppData();
  const product = PRODUCTS.find((p) => p.id === productId)!;
  const [payMode, setPayMode] = useState<'pre' | 'post'>('pre');
  const [myQty, setMyQty] = useState('5');

  const start = () => {
    const id = createChama(productId, payMode);
    nav.replace('ChamaDetail', { id });
  };

  return (
    <Screen scroll>
      <BackHeader title="Start a Chama Buy" />
      <Text className="mb-5 mt-4 text-base leading-6 text-ink-soft dark:text-sink-soft">
        For <Text className="font-bold text-ink dark:text-sink">{product.name}</Text>. Needs {product.wholesale?.minQty} pieces to unlock {formatKsh(product.wholesale?.unitPrice ?? 0)} each. Invite people, each picks their own quantity, delivered as one order.
      </Text>

      <Text className="mb-3 text-lg font-extrabold text-ink dark:text-sink">How should the group pay?</Text>
      <Option active={payMode === 'pre'} icon="people" title="Everyone pays their own share" body="Simplest — each person pays before the order is packed" onPress={() => setPayMode('pre')} />
      <Option active={payMode === 'post'} icon="person" title="One person pays for everyone" body="Easier for the rider — pick who pays when it's delivered" onPress={() => setPayMode('post')} />

      <Text className="mb-2 mt-5 text-sm font-medium text-ink dark:text-sink">How many pieces are you taking?</Text>
      <View className="mb-6 h-14 flex-row items-center rounded-2xl border border-line dark:border-surface-line bg-white dark:bg-surface px-4">
        <Ionicons name="cube-outline" size={18} color={ic.faint} />
        <TextInput value={myQty} onChangeText={setMyQty} keyboardType="number-pad" className="ml-3 flex-1 text-base text-ink dark:text-sink" />
      </View>

      <Button title="Create group" onPress={start} />
    </Screen>
  );
}
