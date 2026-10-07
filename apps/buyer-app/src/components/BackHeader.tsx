import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

export default function BackHeader({ title, right }: { title?: string; right?: React.ReactNode }) {
  const nav = useNavigation();
  return (
    <View className="h-14 flex-row items-center justify-between">
      <Pressable
        hitSlop={12}
        onPress={() => nav.goBack()}
        accessibilityLabel="Go back"
        className="h-10 w-10 items-center justify-center rounded-full bg-white active:bg-brand-50"
      >
        <Ionicons name="arrow-back" size={20} color="#1C1917" />
      </Pressable>
      {title ? <Text className="text-base font-semibold text-ink">{title}</Text> : <View />}
      <View className="min-w-[40px] items-end">{right}</View>
    </View>
  );
}
