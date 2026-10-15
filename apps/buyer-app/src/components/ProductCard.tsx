import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ProductImage from './ProductImage';
import { MiniTimer } from './FlashTimer';
import { useAppData } from '../context/AppDataContext';
import { categoryName, formatKsh, Product } from '../data/mock';

interface Props {
  item: Product;
  width: number;
  imageHeight?: number;
  onPress: () => void;
  priceAccent?: boolean;
  showTimer?: boolean;
  selectMode?: boolean;
  selected?: boolean;
  onLongPress?: () => void;
}

export default function ProductCard({ item, width, imageHeight = 110, onPress, priceAccent, showTimer, selectMode, selected, onLongPress }: Props) {
  const { favorites, toggleFavorite } = useAppData();
  const fav = favorites.includes(item.id);
  return (
    <Pressable onPress={onPress} onLongPress={onLongPress} delayLongPress={280} accessibilityLabel={`${item.name}, ${formatKsh(item.price)}`} style={{ width }} className={`overflow-hidden rounded-2xl border bg-white dark:bg-surface  ${selected ? 'border-brand-500' : 'border-line dark:border-surface-line'}`}>
      <View>
        <ProductImage product={item} height={imageHeight} />
        {item.badge && (
          <View className={`absolute right-2 top-2 rounded-md px-2 py-0.5 ${item.badge === 'Popular' ? 'bg-brand-500' : 'bg-ink-70'}`}>
            <Text className="text-[10px] font-semibold text-white">{item.badge}</Text>
          </View>
        )}
        {showTimer && item.flashEndsAt ? <MiniTimer endsAt={item.flashEndsAt} /> : null}
        {selectMode && (<View className={`absolute left-2 top-2 h-6 w-6 items-center justify-center rounded-full border-2 ${selected ? 'border-brand-500 bg-brand-500' : 'border-white bg-black-20'}`}>{selected && <Ionicons name="checkmark" size={14} color="#fff" />}</View>)}
        <Pressable hitSlop={8} onPress={() => toggleFavorite(item.id)} accessibilityLabel={fav ? 'Remove from saved' : 'Save'} className="absolute bottom-2 right-2 h-7 w-7 items-center justify-center rounded-full bg-white-90">
          <Ionicons name={fav ? 'heart' : 'heart-outline'} size={16} color={fav ? '#F44236' : '#57534E'} />
        </Pressable>
      </View>
      <View className="px-3 pb-3 pt-2.5">
        <Text className="text-[11px] text-ink-mute dark:text-sink-mute">{categoryName(item.category)}</Text>
        <Text numberOfLines={1} className="mt-0.5 text-sm font-bold text-ink dark:text-sink">{item.name}</Text>
        {item.oldPrice ? <Text className="mt-0.5 text-xs text-ink-mute line-through">{item.oldPrice.toLocaleString('en-KE')}</Text> : <View className="h-4" />}
      </View>
      {/* hang-tag price */}
      <View className={`absolute left-0 flex-row items-center rounded-r-lg py-1 pl-2 pr-3 ${priceAccent ? 'bg-brand-500' : 'bg-ink'}`} style={{ top: imageHeight - 14 }}>
        <View className="mr-1.5 h-1.5 w-1.5 rounded-full bg-white-70" />
        <Text className="text-xs font-extrabold text-white">{formatKsh(item.price)}</Text>
      </View>
    </Pressable>
  );
}
