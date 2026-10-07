import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Props {
  children: React.ReactNode;
  scroll?: boolean;
  bg?: string; // tailwind bg class
  className?: string;
}

/** Safe area + keyboard avoiding + optional scroll. Wrap every screen in this. */
export default function Screen({ children, scroll, bg = 'bg-cream', className = '' }: Props) {
  const inner = scroll ? (
    <ScrollView
      className="flex-1"
      contentContainerStyle={{ flexGrow: 1 }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View className={`flex-1 px-6 pb-6 ${className}`}>{children}</View>
    </ScrollView>
  ) : (
    <View className={`flex-1 px-6 pb-6 ${className}`}>{children}</View>
  );

  return (
    <SafeAreaView className={`flex-1 ${bg}`}>
      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {inner}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
