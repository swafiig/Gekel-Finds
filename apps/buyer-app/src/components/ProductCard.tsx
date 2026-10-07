import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ProductImage from './ProductImage';
import { useAppData } from '../context/AppDataContext';
import { formatKsh, Product } from '../data/mock';

interface Props {
  item: Product;
  width: number;
  imageHeight?: number;
  onPress: () => void;
  priceAccent?: boolean;
}

export default function ProductCard({ item, width, imageHeight = 110, onPress, priceAccent }: Props) {
  const { favorites, toggleFavorite } = useAppData();
  const fav = favorites.includes(item.id);
  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={`${item.name}, ${formatKsh(item.price)}`}
      style={{ width }}
      className="overflow-hidden rounded-2xl border border-line bg-white active:opacity-80"
    >
      <View>
        <ProductImage product={item} height={imageHeight} />
        {item.badge && (
          <View className={`absolute right-2 top-2 rounded-md px-2 py-0.5 ${item.badge === 'Popular' ? 'bg-brand-500' : 'bg-ink/70'}`}>
            <Text className="text-[10px] font-semibold text-white">{item.badge}</Text>
          </View>
        )}
        <Pressable
          hitSlop={8}
          onPress={() => toggleFavorite(item.id)}
          accessibilityLabel={fav ? 'Remove from saved' : 'Save'}
          className="absolute bottom-2 right-2 h-7 w-7 items-center justify-center rounded-full bg-white/90"
        >
          <Ionicons name={fav ? 'heart' : 'heart-outline'} size={16} color={fav ? '#E8590C' : '#57534E'} />
        </Pressable>
      </View>
      <View className="px-3 pb-3 pt-2">
        <Text className="text-[11px] text-ink-mute">{item.category}</Text>
        <Text numberOfLines={1} className="mt-0.5 text-sm font-bold text-ink">{item.name}</Text>
        <Text className={`mt-1 text-sm font-bold ${priceAccent ? 'text-brand-600' : 'text-ink'}`}>{formatKsh(item.price)}</Text>
      </View>
    </Pressable>
  );
}
