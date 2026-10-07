import React from 'react';
import { Linking, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useRoute } from '@react-navigation/native';
import Screen from '../../components/Screen';
import BackHeader from '../../components/BackHeader';
import Button from '../../components/Button';
import Timeline from '../../components/Timeline';
import EmptyState from '../../components/EmptyState';
import ProductImage from '../../components/ProductImage';
import { useAppData } from '../../context/AppDataContext';
import { ORDER_STAGES, PRODUCTS, formatKsh } from '../../data/mock';
import { useNav } from '../../hooks/useNav';
import type { RootStackParamList } from '../../types/navigation';

export default function OrderDetailScreen() {
  const nav = useNav();
  const { id } = useRoute<RouteProp<RootStackParamList, 'OrderDetail'>>().params;
  const { orders, advanceOrder } = useAppData();
  const order = orders.find((o) => o.id === id);

  if (!order) return <Screen><BackHeader /><EmptyState icon="alert-circle-outline" title="Order not found" body="It may have been removed." cta="Go home" onCta={() => nav.navigate('Main')} /></Screen>;

  const p = PRODUCTS.find((x) => x.id === order.productId)!;
  const delivered = order.stage === 3;

  return (
    <Screen scroll>
      <BackHeader title="Order" />

      <View className={`mt-4 rounded-2xl p-4 ${delivered ? 'bg-green-50' : 'bg-brand-500'}`}>
        <Text className={`text-sm ${delivered ? 'text-success' : 'text-white/80'}`}>{delivered ? 'Delivered' : 'Estimated arrival'}</Text>
        <Text className={`mt-1 text-3xl font-extrabold ${delivered ? 'text-success' : 'text-white'}`}>
          {delivered ? 'Enjoy your find!' : order.etaMinutes > 0 ? `${order.etaMinutes} min` : 'Getting ready'}
        </Text>
        <Text className={`mt-1 text-sm ${delivered ? 'text-ink-soft' : 'text-white/90'}`}>{ORDER_STAGES[order.stage]}</Text>
      </View>

      <View className="mt-5 flex-row items-center rounded-2xl border border-line bg-white p-3">
        <View className="h-16 w-16 overflow-hidden rounded-xl"><ProductImage product={p} height={64} artSize={44} /></View>
        <View className="ml-3 flex-1">
          <Text className="text-base font-bold text-ink">{p.name}</Text>
          <Text className="text-sm text-ink-soft">Order #{order.id.slice(0, 5).toUpperCase()}</Text>
        </View>
        <Text className="text-base font-extrabold text-ink">{formatKsh(order.price + order.deliveryFee)}</Text>
      </View>

      <Text className="mb-4 mt-6 text-lg font-bold text-ink">Tracking</Text>
      <Timeline steps={ORDER_STAGES} current={order.stage} />

      {order.stage >= 1 && (
        <View className="mb-5 rounded-2xl border border-line bg-white p-4">
          <View className="flex-row items-center">
            <Ionicons name="shield-checkmark" size={20} color="#15803D" />
            <Text className="ml-2 text-base font-bold text-ink">Tamper seal verified</Text>
          </View>
          <Text className="mt-2 text-sm text-ink-soft">Seal serial number</Text>
          <Text className="text-lg font-extrabold tracking-widest text-ink">{order.sealNo}</Text>
          <Text className="mt-2 text-xs text-ink-mute">Check that the tape number matches before you accept the parcel.</Text>
        </View>
      )}

      {order.stage >= 2 && !delivered && (
        <View className="mb-5 rounded-2xl border border-line bg-white p-4">
          <View className="flex-row items-center">
            <View className="h-12 w-12 items-center justify-center rounded-full bg-brand-50"><Ionicons name="bicycle" size={24} color="#E8590C" /></View>
            <View className="ml-3 flex-1">
              <Text className="text-base font-bold text-ink">{order.riderName}</Text>
              <Text className="text-sm text-ink-soft">Your rider</Text>
            </View>
          </View>
          <View className="mt-3 flex-row gap-3">
            <Button title="Call" icon="call-outline" variant="outline" className="h-11 flex-1" onPress={() => Linking.openURL(`tel:${order.riderPhone}`)} />
            <Button title="Chat" icon="chatbubble-outline" variant="outline" className="h-11 flex-1" onPress={() => nav.navigate('ChatRoom', { id: 'c1' })} />
          </View>
        </View>
      )}

      <View className="rounded-2xl bg-cream p-4">
        <Line label="Item (paid to supplier)" value={formatKsh(order.price)} />
        <Line label="Delivery fee" value={formatKsh(order.deliveryFee)} />
        <View className="my-2 h-px bg-line" />
        <Line label="Total" value={formatKsh(order.price + order.deliveryFee)} bold />
      </View>

      {__DEV__ && !delivered && <Button title="[Dev] Simulate next step" variant="ghost" className="mt-3" onPress={() => advanceOrder(order.id)} />}
    </Screen>
  );
}

const Line = ({ label, value, bold }: { label: string; value: string; bold?: boolean }) => (
  <View className="flex-row items-center justify-between py-1">
    <Text className={`text-sm ${bold ? 'font-bold text-ink' : 'text-ink-soft'}`}>{label}</Text>
    <Text className={`${bold ? 'text-base font-extrabold' : 'text-sm font-semibold'} text-ink`}>{value}</Text>
  </View>
);
