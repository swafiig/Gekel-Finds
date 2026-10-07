import React from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <View accessibilityLiveRegion="polite" className="mb-4 flex-row items-start rounded-2xl bg-red-50 p-3">
      <Ionicons name="alert-circle" size={18} color="#DC2626" style={{ marginTop: 1, marginRight: 8 }} />
      <Text className="flex-1 text-sm text-danger">{message}</Text>
    </View>
  );
}
