import React from 'react';
import { Image, Text, View } from 'react-native';

export default function Avatar({ uri, name, size = 40 }: { uri?: string; name?: string; size?: number }) {
  if (uri) return <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2 }} />;
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2 }} className="items-center justify-center bg-brand-500">
      <Text style={{ fontSize: size * 0.42 }} className="font-extrabold text-white">{(name ?? 'G').charAt(0).toUpperCase()}</Text>
    </View>
  );
}
