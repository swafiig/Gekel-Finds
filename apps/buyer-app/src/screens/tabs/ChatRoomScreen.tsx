import React, { useEffect, useState } from 'react';
import { FlatList, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useRoute } from '@react-navigation/native';
import Screen from '../../components/Screen';
import BackHeader from '../../components/BackHeader';
import { useAppData } from '../../context/AppDataContext';
import type { RootStackParamList } from '../../types/navigation';

const QUICK = ['Is it still available?', 'Send me a photo', 'Can you confirm the price?'];

export default function ChatRoomScreen() {
  const { id } = useRoute<RouteProp<RootStackParamList, 'ChatRoom'>>().params;
  const { chats, sendMessage, markChatRead } = useAppData();
  const chat = chats.find((c) => c.id === id);
  const [text, setText] = useState('');

  useEffect(() => { markChatRead(id); }, [id, markChatRead, chat?.messages.length]);
  if (!chat) return null;

  const send = (t = text) => {
    const v = t.trim();
    if (!v) return;
    sendMessage(id, v);
    setText('');
  };

  return (
    <Screen>
      <BackHeader title={chat.name} />
      <Text className="mb-2 text-center text-xs text-ink-mute">{chat.role}</Text>
      <FlatList
        inverted
        data={[...chat.messages].reverse()}
        keyExtractor={(m) => m.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingVertical: 8 }}
        renderItem={({ item }) => (
          <View className={`mb-2 max-w-[80%] rounded-2xl px-4 py-2.5 ${item.from === 'me' ? 'self-end rounded-br-sm bg-brand-500' : 'self-start rounded-bl-sm bg-white border border-line'}`}>
            <Text className={`text-base ${item.from === 'me' ? 'text-white' : 'text-ink'}`}>{item.text}</Text>
          </View>
        )}
      />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="max-h-11 -mx-6" contentContainerStyle={{ paddingHorizontal: 24 }}>
        {QUICK.map((q) => (
          <Pressable key={q} onPress={() => send(q)} className="mr-2 h-9 justify-center rounded-full border border-brand-200 bg-brand-50 px-3.5">
            <Text className="text-sm font-medium text-brand-700">{q}</Text>
          </Pressable>
        ))}
      </ScrollView>
      <View className="mt-3 flex-row items-center">
        <View className="mr-2 h-12 flex-1 justify-center rounded-full border border-line bg-white px-4">
          <TextInput value={text} onChangeText={setText} placeholder="Message" placeholderTextColor="#A8A29E" className="text-base text-ink" returnKeyType="send" onSubmitEditing={() => send()} />
        </View>
        <Pressable onPress={() => send()} accessibilityLabel="Send" disabled={!text.trim()} className={`h-12 w-12 items-center justify-center rounded-full ${text.trim() ? 'bg-brand-500' : 'bg-brand-200'}`}>
          <Ionicons name="send" size={18} color="#fff" />
        </Pressable>
      </View>
    </Screen>
  );
}
