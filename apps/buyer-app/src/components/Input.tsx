import React, { forwardRef, useState } from 'react';
import { Pressable, Text, TextInput, TextInputProps, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Props extends TextInputProps {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  error?: string;
  hint?: string;
  secure?: boolean;
}

const Input = forwardRef<TextInput, Props>(function Input(
  { label, icon, error, hint, secure, onFocus, onBlur, ...rest },
  ref,
) {
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(!!secure);

  const border = error ? 'border-danger' : focused ? 'border-brand-500' : 'border-line';

  return (
    <View className="mb-4">
      <Text className="mb-1.5 text-sm font-medium text-ink">{label}</Text>
      <View className={`h-14 flex-row items-center rounded-2xl border bg-white px-4 ${border}`}>
        {icon && (
          <Ionicons name={icon} size={20} color={focused ? '#E8590C' : '#A8A29E'} style={{ marginRight: 10 }} />
        )}
        <TextInput
          ref={ref}
          className="flex-1 text-base text-ink"
          placeholderTextColor="#A8A29E"
          secureTextEntry={secure && hidden}
          autoCapitalize="none"
          autoCorrect={false}
          accessibilityLabel={label}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          {...rest}
        />
        {secure && (
          <Pressable
            hitSlop={12}
            onPress={() => setHidden((h) => !h)}
            accessibilityLabel={hidden ? 'Show password' : 'Hide password'}
          >
            <Ionicons name={hidden ? 'eye-outline' : 'eye-off-outline'} size={20} color="#A8A29E" />
          </Pressable>
        )}
      </View>
      {error ? (
        <Text className="mt-1.5 text-sm text-danger">{error}</Text>
      ) : hint ? (
        <Text className="mt-1.5 text-sm text-ink-mute">{hint}</Text>
      ) : null}
    </View>
  );
});

export default Input;
