import React from 'react';
import { Text, View } from 'react-native';
import { passwordStrength } from '../utils/validation';

const LABELS = ['', 'Weak', 'Fair', 'Good', 'Strong'];
const COLORS = ['bg-line', 'bg-red-500', 'bg-amber-500', 'bg-lime-500', 'bg-success'];

export default function PasswordStrength({ value }: { value: string }) {
  if (!value) return null;
  const s = passwordStrength(value);
  return (
    <View className="-mt-2 mb-4">
      <View className="flex-row gap-1.5">
        {[1, 2, 3, 4].map((i) => (
          <View key={i} className={`h-1.5 flex-1 rounded-full ${i <= s ? COLORS[s] : 'bg-line'}`} />
        ))}
      </View>
      <Text className="mt-1.5 text-xs text-ink-mute">Password strength: {LABELS[s]}</Text>
    </View>
  );
}
