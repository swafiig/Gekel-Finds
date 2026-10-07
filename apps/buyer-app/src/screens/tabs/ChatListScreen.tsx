import React from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppData } from '../../context/AppDataContext';
import { timeAgo } from '../../data/mock';
import { useNav } from '../../hooks/useNav';

export default function ChatListScreen() {
  const nav = useNav();
  const { chats } = useAppData();
  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <Text className="px-5 pb-3 pt-3 text-[28px] font-extrabold text-ink">Chat</Text>
      <FlatList
        data={chats}
        keyExtractor={(c) => c.id}
        renderItem={({ item }) => {
          const last = item.messages[item.messages.length - 1];
          return (
            <Pressable onPress={() => nav.navigate('ChatRoom', { id: item.id })} className="flex-row items-center border-b border-line px-5 py-4 active:bg-cream">
              <View className="h-12 w-12 items-center justify-center rounded-full bg-brand-500">
                <Text className="text-lg font-bold text-white">{item.name.charAt(0)}</Text>
              </View>
              <View className="ml-3 flex-1">
                <View className="flex-row items-center justify-between">
                  <Text className="text-base font-bold text-ink">{item.name}</Text>
                  <Text className="text-xs text-ink-mute">{timeAgo(last.at)}</Text>
                </View>
                <View className="mt-0.5 flex-row items-center">
                  <Text numberOfLines={1} className={`flex-1 text-sm ${item.unread ? 'font-semibold text-ink' : 'text-ink-soft'}`}>{last.text}</Text>
                  {item.unread > 0 && <View className="ml-2 h-5 min-w-[20px] items-center justify-center rounded-full bg-brand-500 px-1"><Text className="text-[11px] font-bold text-white">{item.unread}</Text></View>}
                </View>
              </View>
            </Pressable>
          );
        }}
      />
    </SafeAreaView>
  );
}
