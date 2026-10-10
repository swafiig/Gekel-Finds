import React from 'react';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/** Read-only stars, or tappable when `onChange` is given. */
export default function Stars({ value, size = 14, onChange }: { value: number; size?: number; onChange?: (v: number) => void }) {
  return (
    <View className="flex-row">
      {[1, 2, 3, 4, 5].map((i) => {
        const name = value >= i - 0.25 ? 'star' : value >= i - 0.75 ? 'star-half' : 'star-outline';
        const icon = <Ionicons name={name} size={size} color="#F5A623" />;
        return onChange ? (
          <Pressable key={i} hitSlop={4} onPress={() => onChange(i)} accessibilityLabel={`${i} stars`} style={{ marginRight: 4 }}>{icon}</Pressable>
        ) : (
          <View key={i} style={{ marginRight: 1 }}>{icon}</View>
        );
      })}
    </View>
  );
}
