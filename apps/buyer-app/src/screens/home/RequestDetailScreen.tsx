import React from 'react';
import { Alert, Image, Text, View } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import Screen from '../../components/Screen';
import BackHeader from '../../components/BackHeader';
import Button from '../../components/Button';
import Timeline from '../../components/Timeline';
import EmptyState from '../../components/EmptyState';
import ProductImage from '../../components/ProductImage';
import { useAppData, requestStatus, requestNote } from '../../context/AppDataContext';
import { PRODUCTS, REQUEST_STAGES, formatKsh } from '../../data/mock';
import { useNav } from '../../hooks/useNav';
import type { RootStackParamList } from '../../types/navigation';

export default function RequestDetailScreen() {
  const nav = useNav();
  const { id } = useRoute<RouteProp<RootStackParamList, 'RequestDetail'>>().params;
  const { requests, cancelRequest, advanceRequest } = useAppData();
  const r = requests.find((x) => x.id === id);

  if (!r) {
    return (
      <Screen><BackHeader />
        <EmptyState icon="alert-circle-outline" title="Request not found" body="It may have been removed." cta="Go home" onCta={() => nav.navigate('Main')} />
      </Screen>
    );
  }

  const status = requestStatus(r);
  const found = r.stage >= 2 && !r.cancelled && r.kind !== 'ownSupplier' ? PRODUCTS.find((p) => p.id === 'p6')! : undefined;
  const canCancel = !r.cancelled && r.stage < 3;

  const confirmCancel = () =>
    Alert.alert('Cancel this request?', 'We will stop searching. You will not be charged.', [
      { text: 'Keep searching', style: 'cancel' },
      { text: 'Cancel request', style: 'destructive', onPress: () => cancelRequest(r.id) },
    ]);

  return (
    <Screen scroll>
      <BackHeader title="Request" />
      <View className="mt-4 flex-row items-start justify-between">
        <Text className="flex-1 pr-3 text-2xl font-extrabold leading-8 text-ink">{r.title}</Text>
        <View className={`rounded-md px-2.5 py-1 ${status === 'Cancelled' ? 'bg-stone-200' : status === 'Found' ? 'bg-green-100' : 'bg-amber-50'}`}>
          <Text className={`text-xs font-bold ${status === 'Cancelled' ? 'text-stone-600' : status === 'Found' ? 'text-success' : 'text-amber-700'}`}>{status}</Text>
        </View>
      </View>
      <Text className="mt-1 text-sm text-ink-soft">{requestNote(r)}</Text>

      <View className="mt-4 flex-row flex-wrap gap-2">
        {r.category && <Meta label={r.category} />}
        {r.budget ? <Meta label={`Budget ${formatKsh(r.budget)}`} /> : null}
        <Meta label={r.urgency === 'sameDay' ? 'Same day' : 'Within 3 days'} />
      </View>

      {r.supplier && (
        <View className="mt-4 rounded-2xl border border-line bg-white p-4">
          <Text className="text-xs font-bold tracking-widest text-ink-mute">YOUR SUPPLIER</Text>
          <Text className="mt-1 text-base font-bold text-ink">{r.supplier.name}</Text>
          <Text className="text-sm text-ink-soft">{r.supplier.location} · {r.supplier.phone}</Text>
          {r.supplier.till ? <Text className="mt-1 text-sm text-ink-soft">Till {r.supplier.till}</Text> : null}
        </View>
      )}

      {r.photoUri && <Image source={{ uri: r.photoUri }} className="mt-4 h-44 w-full rounded-2xl" resizeMode="cover" />}

      {found && (
        <View className="mt-5 overflow-hidden rounded-2xl border border-green-200 bg-white">
          <View className="bg-green-50 px-4 py-2"><Text className="text-sm font-bold text-success">GEKEL found it</Text></View>
          <View className="flex-row items-center p-3">
            <View className="h-20 w-20 overflow-hidden rounded-xl"><ProductImage product={found} height={80} artSize={56} /></View>
            <View className="ml-3 flex-1">
              <Text className="text-base font-bold text-ink">{found.name}</Text>
              <Text className="text-sm text-ink-soft">Confirmed price</Text>
              <Text className="text-base font-extrabold text-brand-600">{formatKsh(found.price)}</Text>
            </View>
          </View>
          <View className="flex-row gap-3 px-3 pb-3">
            <Button title="Order this" className="h-12 flex-1" onPress={() => nav.navigate('Checkout', { lines: [{ productId: found.id, qty: 1 }] })} />
            <Button title="Chat" variant="outline" icon="chatbubble-outline" className="h-12 flex-1" onPress={() => nav.navigate('ChatRoom', { id: 'c1' })} />
          </View>
        </View>
      )}

      <Text className="mb-4 mt-7 text-lg font-bold text-ink">Progress</Text>
      <Timeline steps={REQUEST_STAGES} current={r.stage} cancelled={r.cancelled} />

      {canCancel && <Button title="Cancel request" variant="danger" className="mt-2" onPress={confirmCancel} />}
      {__DEV__ && !r.cancelled && r.stage < 5 && (
        <Button title="[Dev] Simulate next step" variant="ghost" className="mt-2" onPress={() => advanceRequest(r.id)} />
      )}
    </Screen>
  );
}

const Meta = ({ label }: { label: string }) => (
  <View className="rounded-full border border-line bg-white px-3 py-1.5"><Text className="text-xs font-semibold text-ink-soft">{label}</Text></View>
);
