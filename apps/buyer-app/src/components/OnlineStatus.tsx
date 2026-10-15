import React from 'react';
import { Text, View } from 'react-native';
import { timeAgo } from '../data/mock';

export default function OnlineStatus({ online, lastSeen, light }: { online: boolean; lastSeen: number; light?: boolean }) {
  return (
    <View className="flex-row items-center">
      <View className={`mr-1.5 h-2 w-2 rounded-full ${online ? 'bg-green-500' : 'bg-stone-400'}`} />
      <Text className={`text-xs ${light ? 'text-white-85' : 'text-ink-soft'}`}>{online ? 'Online now' : `Last online ${timeAgo(lastSeen)}`}</Text>
    </View>
  );
}
