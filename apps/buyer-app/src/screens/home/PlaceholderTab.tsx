import React from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

/** Empty-state screen for tabs whose backend is not ready yet. */
export default function PlaceholderTab({ icon, title, body }: { icon: keyof typeof Ionicons.glyphMap; title: string; body: string }) {
  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <View className="flex-1 items-center justify-center px-10">
        <View className="mb-5 h-20 w-20 items-center justify-center rounded-full bg-brand-50">
          <Ionicons name={icon} size={36} color="#E8590C" />
        </View>
        <Text className="text-xl font-bold text-ink">{title}</Text>
        <Text className="mt-2 text-center text-base text-ink-soft">{body}</Text>
      </View>
    </SafeAreaView>
  );
}
