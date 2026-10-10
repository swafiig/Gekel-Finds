import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useRoute } from '@react-navigation/native';
import Screen from '../../components/Screen';
import BackHeader from '../../components/BackHeader';
import Button from '../../components/Button';
import { orderStages, useAppData } from '../../context/AppDataContext';
import { PRODUCTS, SUPPLIERS, formatKsh } from '../../data/mock';
import { useNav } from '../../hooks/useNav';
import type { RootStackParamList } from '../../types/navigation';

/** One checkout, many shops. Each shop confirms and is paid separately, delivery is shared. */
export default function BundleScreen() {
  const nav = useNav();
  const { id } = useRoute<RouteProp<RootStackParamList, 'Bundle'>>().params;
  const { orders } = useAppData();
  const list = orders.filter((o) => o.bundleId === id);
  const live = list.filter((o) => !o.cancelled);
  const paid = live.filter((o) => o.stage >= 1).length;
  const fees = list.reduce((n, o) => n + o.deliveryFee + o.serviceFee, 0);
  const total = list.filter((o) => !o.cancelled).reduce((n, o) => n + o.price, 0) + fees;

  return (
    <Screen scroll>
      <BackHeader title="Your combined order" onBack={() => nav.popToTop()} />
      <View className="mt-4 rounded-2xl bg-ink p-5">
        <Text className="text-sm text-white/70">Shops paid</Text>
        <Text className="mt-1 text-4xl font-extrabold text-white">{paid} <Text className="text-xl text-white/60">of {live.length}</Text></Text>
        <View className="mt-3 h-2 overflow-hidden rounded-full bg-white/20"><View style={{ width: `${live.length ? (paid / live.length) * 100 : 0}%` }} className="h-full rounded-full bg-brand-500" /></View>
        <Text className="mt-3 text-sm text-white/80">One rider collects from every shop once all are packed.</Text>
      </View>

      <Text className="mb-3 mt-6 text-lg font-extrabold text-ink">Shops</Text>
      {list.map((o) => {
        const s = SUPPLIERS.find((x) => x.id === o.supplierId)!;
        const names = o.items.map((i) => `${i.qty} × ${PRODUCTS.find((p) => p.id === i.productId)!.name}`).join(', ');
        const status = o.cancelled ? ['Cancelled', 'bg-stone-200 text-stone-600'] : o.quote === 'pending' ? ['Waiting for shop', 'bg-amber-50 text-amber-700'] : o.stage === 0 ? ['Pay now', 'bg-brand-50 text-brand-600'] : ['Paid · ' + orderStages(o)[o.stage], 'bg-green-100 text-success'];
        return (
          <View key={o.id} className="mb-3 rounded-2xl border border-line bg-white p-4">
            <View className="flex-row items-center justify-between">
              <Text className="flex-1 pr-2 text-base font-bold text-ink">{s.name}</Text>
              <View className={`rounded-md px-2 py-1 ${status[1].split(' ')[0]}`}><Text className={`text-xs font-bold ${status[1].split(' ')[1]}`}>{status[0]}</Text></View>
            </View>
            <Text numberOfLines={2} className="mt-1 text-sm text-ink-soft">{names}</Text>
            <Text className="mt-1 text-base font-extrabold text-ink">{formatKsh(o.price)}</Text>
            <View className="mt-3 flex-row gap-3">
              <Button title={o.stage === 0 && !o.cancelled ? 'Open chat to pay' : 'Open chat'} icon="chatbubble-outline" variant={o.stage === 0 && !o.cancelled ? 'primary' : 'outline'} className="h-11 flex-1" onPress={() => nav.navigate('ChatRoom', { id: o.chatId })} />
              <Button title="Track" variant="outline" className="h-11 w-24" onPress={() => nav.navigate('OrderDetail', { id: o.id })} />
            </View>
          </View>
        );
      })}

      <View className="rounded-2xl bg-cream p-4">
        <Row label="Delivery + service fee (shared)" value={formatKsh(fees)} />
        <Row label="Items, paid to each shop" value={formatKsh(total - fees)} />
        <View className="my-2 h-px bg-line" />
        <Row label="Total" value={formatKsh(total)} bold />
      </View>
      <Button title="Back to home" variant="ghost" className="mt-3" onPress={() => nav.popToTop()} />
    </Screen>
  );
}
const Row = ({ label, value, bold }: { label: string; value: string; bold?: boolean }) => (
  <View className="flex-row items-center justify-between py-1"><Text className={`flex-1 pr-3 text-sm ${bold ? 'font-bold text-ink' : 'text-ink-soft'}`}>{label}</Text><Text className={`${bold ? 'text-base font-extrabold' : 'text-sm font-semibold'} text-ink`}>{value}</Text></View>
);
