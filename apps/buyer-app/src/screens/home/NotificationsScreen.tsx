import React, { useEffect } from 'react';
import { FlatList, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../../components/Screen';
import BackHeader from '../../components/BackHeader';
import EmptyState from '../../components/EmptyState';
import { useAppData } from '../../context/AppDataContext';

export default function NotificationsScreen() {
  const { notifications, markNotificationsRead } = useAppData();
  useEffect(() => { markNotificationsRead(); }, [markNotificationsRead]);
  return (
    <Screen>
      <BackHeader title="Notifications" />
      <FlatList
        className="mt-4"
        data={notifications}
        keyExtractor={(n) => n.id}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={<EmptyState icon="notifications-outline" title="Nothing yet" body="Updates on your orders, requests and followed suppliers show up here." />}
        renderItem={({ item }) => (
          <View className="mb-3 flex-row rounded-2xl border border-line dark:border-surface-line bg-white dark:bg-surface p-4">
            <View className="h-10 w-10 items-center justify-center rounded-full bg-brand-50"><Ionicons name={item.icon} size={20} color="#F44236" /></View>
            <View className="ml-3 flex-1">
              <View className="flex-row items-center justify-between">
                <Text className="text-base font-bold text-ink dark:text-sink">{item.title}</Text>
                <Text className="text-xs text-ink-mute dark:text-sink-mute">{item.time}</Text>
              </View>
              <Text className="mt-1 text-sm leading-5 text-ink-soft dark:text-sink-soft">{item.body}</Text>
            </View>
          </View>
        )}
      />
    </Screen>
  );
}
