import React from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import Screen from '../../components/Screen';
import BackHeader from '../../components/BackHeader';
import EmptyState from '../../components/EmptyState';
import { requestNote, requestStatus, useAppData } from '../../context/AppDataContext';
import { timeAgo } from '../../data/mock';
import { useNav } from '../../hooks/useNav';

export default function RequestsScreen() {
  const nav = useNav();
  const { requests } = useAppData();
  return (
    <Screen>
      <BackHeader title="My requests" />
      <FlatList
        className="mt-4" data={requests} keyExtractor={(r) => r.id} showsVerticalScrollIndicator={false}
        ListEmptyComponent={<EmptyState icon="list-outline" title="No requests yet" body="Ask GEKEL for anything and it shows up here." cta="Ask GEKEL" onCta={() => nav.replace('AskGekel')} />}
        renderItem={({ item: r }) => (
          <Pressable onPress={() => nav.navigate('RequestDetail', { id: r.id })} className="mb-3 rounded-2xl border border-line bg-white p-4 active:bg-cream">
            <View className="flex-row items-start justify-between"><Text className="flex-1 pr-3 text-base font-bold text-ink">{r.title}</Text><Text className="text-xs font-bold text-brand-600">{requestStatus(r)}</Text></View>
            <Text className="mt-1 text-sm text-ink-soft">{requestNote(r)} · {timeAgo(r.createdAt)}</Text>
          </Pressable>
        )}
      />
    </Screen>
  );
}
