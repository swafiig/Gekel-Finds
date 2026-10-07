import React from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/** Vertical progress timeline. `current` is the active step index. */
export default function Timeline({ steps, current, cancelled }: { steps: string[]; current: number; cancelled?: boolean }) {
  return (
    <View>
      {steps.map((s, i) => {
        const done = i < current || (i === current && current === steps.length - 1);
        const active = i === current && !done;
        const last = i === steps.length - 1;
        return (
          <View key={s} className="flex-row">
            <View className="items-center">
              <View className={`h-7 w-7 items-center justify-center rounded-full ${cancelled ? 'bg-line' : done ? 'bg-success' : active ? 'bg-brand-500' : 'bg-line'}`}>
                {done && !cancelled ? <Ionicons name="checkmark" size={16} color="#fff" /> : active && !cancelled ? <View className="h-2.5 w-2.5 rounded-full bg-white" /> : null}
              </View>
              {!last && <View className={`w-0.5 flex-1 ${i < current && !cancelled ? 'bg-success' : 'bg-line'}`} style={{ minHeight: 28 }} />}
            </View>
            <View className="ml-3 flex-1 pb-6">
              <Text className={`text-base ${active ? 'font-bold text-ink' : done ? 'font-semibold text-ink' : 'text-ink-mute'}`}>{s}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}
