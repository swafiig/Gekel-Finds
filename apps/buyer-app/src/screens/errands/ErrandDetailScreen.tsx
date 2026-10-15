import React from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useRoute } from '@react-navigation/native';
import Screen from '../../components/Screen';
import BackHeader from '../../components/BackHeader';
import Button from '../../components/Button';
import Timeline from '../../components/Timeline';
import EmptyState from '../../components/EmptyState';
import { ERRAND_STAGES, useAppData } from '../../context/AppDataContext';
import { ERRAND_TYPES, timeAgo } from '../../data/mock';
import { useNav } from '../../hooks/useNav';
import type { RootStackParamList } from '../../types/navigation';

export default function ErrandDetailScreen() {
  const nav = useNav();
  const { id } = useRoute<RouteProp<RootStackParamList, 'ErrandDetail'>>().params;
  const { errands, advanceErrand } = useAppData();
  const errand = errands.find((e) => e.id === id);
  if (!errand) return <Screen><BackHeader /><EmptyState icon="alert-circle-outline" title="Not found" body="This errand may have been removed." cta="Go home" onCta={() => nav.navigate('Main')} /></Screen>;
  const type = ERRAND_TYPES.find((t) => t.id === errand.typeId)!;

  return (
    <Screen scroll>
      <BackHeader title="Errand" />
      <View className="mt-4 flex-row items-center rounded-2xl bg-brand-500 p-4">
        <View className="h-12 w-12 items-center justify-center rounded-full bg-white-20"><Ionicons name={type.icon as any} size={22} color="#fff" /></View>
        <View className="ml-3 flex-1"><Text className="text-base font-bold text-white">{type.title}</Text><Text className="text-sm text-white-85">Sent {timeAgo(errand.createdAt)}</Text></View>
      </View>
      <Text className="mt-4 text-sm leading-6 text-ink-soft dark:text-sink-soft">{errand.details}</Text>

      <Text className="mb-4 mt-6 text-lg font-extrabold text-ink dark:text-sink">Progress</Text>
      <Timeline steps={ERRAND_STAGES} current={errand.stage} />

      {__DEV__ && errand.stage < ERRAND_STAGES.length - 1 && <Button title="[Dev] Simulate next step" variant="ghost" onPress={() => advanceErrand(errand.id)} />}
    </Screen>
  );
}
