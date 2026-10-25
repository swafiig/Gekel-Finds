import { useRef } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

interface Props {
  value: string;
  onChange: (v: string) => void;
  length?: number;
  error?: boolean;
  autoFocus?: boolean;
  onComplete?: (v: string) => void;
}

/** One hidden input drives N visible cells, so paste, SMS autofill and backspace all just work. */
export function OtpInput({ value, onChange, length = 4, error, autoFocus, onComplete }: Props) {
  const ref = useRef<TextInput>(null);
  return (
    <Pressable onPress={() => ref.current?.focus()} accessibilityLabel={`${length} digit code`}>
      <View className="flex-row justify-center" style={{ gap: 10 }}>
        {Array.from({ length }).map((_, i) => {
          const ch = value[i];
          const active = i === Math.min(value.length, length - 1);
          return (
            <View
              key={i}
              className={`h-[60px] w-[52px] items-center justify-center rounded-xl border-2 bg-white ${error ? "border-danger" : active ? "border-brand-500" : "border-line"}`}
            >
              <Text className="text-[26px] font-bold text-ink">{ch ?? ""}</Text>
            </View>
          );
        })}
      </View>
      <TextInput
        ref={ref}
        value={value}
        autoFocus={autoFocus}
        onChangeText={(t) => {
          const v = t.replace(/\D/g, "").slice(0, length);
          onChange(v);
          if (v.length === length) onComplete?.(v);
        }}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        maxLength={length}
        caretHidden
        style={{ position: "absolute", opacity: 0, height: 1, width: 1 }}
      />
    </Pressable>
  );
}
