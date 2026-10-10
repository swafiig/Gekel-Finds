import React from 'react';
import { ActivityIndicator, Pressable, PressableProps, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type Variant = 'primary' | 'outline' | 'ghost' | 'light' | 'dark' | 'danger';

interface Props extends Omit<PressableProps, 'children'> {
  title: string;
  variant?: Variant;
  loading?: boolean;
  /** Icon name. Arrow icons render after the label, others before it. */
  icon?: keyof typeof Ionicons.glyphMap;
  className?: string;
}

const container: Record<Variant, string> = {
  primary: 'bg-brand-500 active:bg-brand-600',
  outline: 'bg-white border border-line active:bg-cream',
  ghost: 'bg-transparent',
  light: 'bg-white active:bg-brand-50',
  dark: 'bg-brand-700 active:opacity-80',
  danger: 'bg-white border border-red-200 active:bg-red-50',
};
const label: Record<Variant, string> = {
  primary: 'text-white', outline: 'text-ink', ghost: 'text-ink-soft', light: 'text-ink', dark: 'text-white', danger: 'text-danger',
};

export default function Button({ title, variant = 'primary', loading, disabled, icon, className = '', ...rest }: Props) {
  const off = disabled || loading;
  const solid = variant === 'primary' || variant === 'dark';
  const iconColor = solid ? '#fff' : variant === 'danger' ? '#DC2626' : '#1C1917';
  const after = !!icon && icon.startsWith('arrow-forward');
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!off, busy: !!loading }}
      disabled={off}
      className={`h-14 flex-row items-center justify-center rounded-full px-6 ${container[variant]} ${off ? 'opacity-60' : ''} ${className}`}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={solid ? '#fff' : '#F44236'} />
      ) : (
        <View className="flex-row items-center">
          {icon && !after && <Ionicons name={icon} size={18} color={iconColor} style={{ marginRight: 8 }} />}
          <Text className={`text-base font-semibold ${label[variant]}`}>{title}</Text>
          {icon && after && <Ionicons name={icon} size={18} color={iconColor} style={{ marginLeft: 8 }} />}
        </View>
      )}
    </Pressable>
  );
}
