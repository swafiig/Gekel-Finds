import React from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCountdown } from '../hooks/useCountdown';

/** Boxed HH : MM : SS countdown for section headers. */
export function FlashTimer({ endsAt }: { endsAt: number }) {
  const { parts, ended } = useCountdown(endsAt);
  if (ended) return <Text className="text-sm font-semibold text-ink-mute">Ended</Text>;
  return (
    <View className="flex-row items-center">
      <Text className="mr-2 text-xs text-ink-soft">Ends in</Text>
      {parts.map((p, i) => (
        <React.Fragment key={i}>
          <View className="h-7 min-w-[30px] items-center justify-center rounded-md bg-ink px-1.5"><Text className="text-sm font-bold text-white">{p}</Text></View>
          {i < 2 && <Text className="mx-0.5 font-bold text-ink">:</Text>}
        </React.Fragment>
      ))}
    </View>
  );
}

/** Small pill for product cards. */
export function MiniTimer({ endsAt }: { endsAt: number }) {
  const { label, ended } = useCountdown(endsAt);
  if (ended) return null;
  return (
    <View className="absolute bottom-2 left-2 flex-row items-center rounded-full bg-ink-80 px-2 py-1">
      <Ionicons name="flash" size={10} color="#FFB020" />
      <Text className="ml-1 text-[10px] font-bold text-white">{label}</Text>
    </View>
  );
}

/** Wide banner for the product page. */
export function FlashBanner({ endsAt }: { endsAt: number }) {
  const { label, ended } = useCountdown(endsAt);
  if (ended) return null;
  return (
    <View className="mb-4 flex-row items-center justify-between rounded-2xl bg-brand-500 px-4 py-3">
      <View className="flex-row items-center"><Ionicons name="flash" size={18} color="#fff" /><Text className="ml-2 text-base font-bold text-white">Flash deal</Text></View>
      <Text className="text-base font-extrabold text-white">{label}</Text>
    </View>
  );
}
