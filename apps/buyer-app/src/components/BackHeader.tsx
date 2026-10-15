import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';

export default function BackHeader({ title, right, onBack }: { title?: string; right?: React.ReactNode; onBack?: () => void }) {
  const nav = useNavigation();
  const { scheme } = useTheme();
  return (
    <View className="h-14 flex-row items-center justify-between">
      <Pressable
        hitSlop={12}
        onPress={() => (onBack ? onBack() : nav.goBack())}
        accessibilityLabel="Go back"
        className="h-10 w-10 items-center justify-center rounded-full bg-white dark:bg-surface active:bg-brand-50 dark:active:bg-surface-soft"
      >
        <Ionicons name="arrow-back" size={20} color={scheme === 'dark' ? '#F2EDE6' : '#1C1917'} />
      </Pressable>
      {title ? <Text className="text-base font-semibold text-ink dark:text-sink">{title}</Text> : <View />}
      <View className="min-w-[40px] items-end">{right}</View>
    </View>
  );
}
