import React from 'react';
import { Pressable, Text } from 'react-native';

export default function Chip({ label, active, onPress }: { label: string; active?: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: !!active }}
      className={`mr-2 h-10 items-center justify-center rounded-full border px-4 ${active ? 'border-brand-500 bg-brand-500' : 'border-line dark:border-surface-line bg-white dark:bg-surface'}`}
    >
      <Text className={`text-sm font-semibold ${active ? 'text-white' : 'text-ink-soft dark:text-sink-soft'}`}>{label}</Text>
    </Pressable>
  );
}
