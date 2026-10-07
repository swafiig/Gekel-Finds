import React from 'react';
import { Image, View } from 'react-native';
import { ProductArt } from './Illustrations';
import type { Product } from '../data/mock';

/** Shows a real photo if `product.image` exists, otherwise the vector illustration. */
export default function ProductImage({ product, height, artSize }: { product: Product; height: number; artSize?: number }) {
  if (product.image) {
    return <Image source={{ uri: product.image }} style={{ width: '100%', height }} resizeMode="cover" />;
  }
  return (
    <View style={{ height, backgroundColor: product.tint }} className="w-full items-center justify-center">
      <ProductArt kind={product.kind} size={artSize ?? height * 0.7} />
    </View>
  );
}
