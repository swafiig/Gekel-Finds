import React from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Button from './Button';
import AskGekelButton from './AskGekelButton';

export default function EmptyState({ icon, title, body, cta, onCta }: { icon: keyof typeof Ionicons.glyphMap; title: string; body: string; cta?: string; onCta?: () => void }) {
  return (
    <View className="items-center px-10 py-16">
      <View className="mb-5 h-20 w-20 items-center justify-center rounded-full bg-brand-50">
        <Ionicons name={icon} size={34} color="#F44236" />
      </View>
      <Text className="text-center text-xl font-bold text-ink">{title}</Text>
      <Text className="mt-2 text-center text-base text-ink-soft">{body}</Text>
      {cta && onCta && (cta === 'Ask GEKEL' ? <View className="mt-6 self-stretch"><AskGekelButton onPress={onCta} /></View> : <Button title={cta} className="mt-6 self-stretch" onPress={onCta} />)}
    </View>
  );
}
