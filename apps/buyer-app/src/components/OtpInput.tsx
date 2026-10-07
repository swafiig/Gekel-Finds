import React, { useRef, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

interface Props {
  length?: number;
  value: string;
  onChange: (v: string) => void;
  onComplete?: (v: string) => void;
  error?: boolean;
}

/** One hidden input drives N visual boxes — supports paste & SMS autofill. */
export default function OtpInput({ length = 6, value, onChange, onComplete, error }: Props) {
  const ref = useRef<TextInput>(null);
  const [focused, setFocused] = useState(true);

  const handle = (t: string) => {
    const v = t.replace(/\D/g, '').slice(0, length);
    onChange(v);
    if (v.length === length) onComplete?.(v);
  };

  return (
    <Pressable onPress={() => ref.current?.focus()} accessibilityLabel="One-time code">
      <View className="flex-row justify-between">
        {Array.from({ length }).map((_, i) => {
          const active = focused && i === Math.min(value.length, length - 1);
          const border = error ? 'border-danger' : active ? 'border-brand-500' : 'border-line';
          return (
            <View key={i} className={`h-14 w-[14%] items-center justify-center rounded-2xl border-2 bg-white ${border}`}>
              <Text className="text-2xl font-bold text-ink">{value[i] ?? ''}</Text>
            </View>
          );
        })}
      </View>
      <TextInput
        ref={ref}
        value={value}
        onChangeText={handle}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="sms-otp"
        maxLength={length}
        autoFocus
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{ position: 'absolute', opacity: 0, width: '100%', height: '100%' }}
      />
    </Pressable>
  );
}
