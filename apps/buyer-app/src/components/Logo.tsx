import React from 'react';
import { Text, View } from 'react-native';
import { LogoMark } from './Illustrations';

export default function Logo({ size = 80, color = '#fff', withWord }: { size?: number; color?: string; withWord?: boolean }) {
  return (
    <View className="items-center">
      <LogoMark size={size} color={color} />
      {withWord && (
        <Text style={{ color, letterSpacing: 12 }} className="mt-4 text-[40px] font-bold">
          GEKEL
        </Text>
      )}
    </View>
  );
}
