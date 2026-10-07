import React, { useRef, useState } from 'react';
import { Animated, FlatList, Pressable, ScrollView, Text, View, useWindowDimensions, ViewToken } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../../components/Screen';
import Button from '../../components/Button';
import { AskIllustration, MarketIllustration, SealIllustration, DeliveryIllustration } from '../../components/Illustrations';
import { useAuth } from '../../context/AuthContext';

type Icon = keyof typeof Ionicons.glyphMap;
const TOTAL = 4;

function FloatChip({ label, icon, dot, style }: { label: string; icon?: Icon; dot?: string; style: object }) {
  return (
    <View style={style} className="absolute flex-row items-center rounded-full bg-white px-2.5 py-1.5 shadow-sm">
      {dot && <View style={{ backgroundColor: dot }} className="mr-1.5 h-2 w-2 rounded-full" />}
      {icon && <Ionicons name={icon} size={11} color="#E8590C" style={{ marginRight: 4 }} />}
      <Text className="text-[9px] font-extrabold tracking-wide text-ink">{label}</Text>
    </View>
  );
}

function IllustrationCard({ children, height }: { children: React.ReactNode; height: number }) {
  return (
    <View style={{ height }} className="mt-6 justify-center overflow-hidden rounded-3xl border border-line bg-white px-3">
      {children}
    </View>
  );
}

/* ───────── The 4 pages, laid out like the design ───────── */
function PageAsk() {
  return (
    <View className="flex-1">
      <Text className="mt-4 text-[40px] font-extrabold leading-[46px] text-ink">Can't find it?</Text>
      <Text className="text-[40px] font-extrabold leading-[46px] text-brand-500">Ask GEKEL.</Text>
      <Text className="mt-3 text-base leading-6 text-ink-soft">
        Just tell us what you need or upload a picture, we'll find it, confirm the price and deliver to you.
      </Text>
      <View className="flex-1 justify-center"><AskIllustration height={300} /></View>
    </View>
  );
}

function PageFind() {
  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 8 }}>
      <Text className="mt-3 text-[26px] font-extrabold leading-8 text-ink">We find it in{'\n'}Nairobi's markets.</Text>
      <Text className="mt-3 text-base leading-6 text-ink-soft">
        Eastleigh, Kamukunji, Gikomba or town stalls. Our local field shoppers locate exactly what you asked for at real wholesale rates.
      </Text>
      <IllustrationCard height={240}>
        <MarketIllustration height={220} />
        <FloatChip label="Direct Stall Price" dot="#22C55E" style={{ right: 14, bottom: 14 }} />
      </IllustrationCard>
    </ScrollView>
  );
}

function PageSeal() {
  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 8 }}>
      <IllustrationCard height={230}>
        <SealIllustration height={210} />
        <FloatChip label="PHOTO #1 · TAMPER SEALED" icon="camera" style={{ right: 12, top: 12 }} />
        <FloatChip label="EASTLEIGH HUB" dot="#16A34A" style={{ left: 12, bottom: 20 }} />
      </IllustrationCard>
      <Text className="mt-6 text-center text-[24px] font-extrabold leading-7 text-ink">Verified & packed{'\n'}with tamper seals.</Text>
      <Text className="mt-3 text-center text-base leading-6 text-ink-soft">
        We inspect your items on the spot and seal them with serialized tamper-evident tape and photo proof before leaving the stall.
      </Text>
      <View className="mt-5 flex-row justify-center gap-6">
        {([['shield-checkmark', 'ZERO TAMPERING'], ['camera', 'PHOTO PROOF']] as [Icon, string][]).map(([i, l]) => (
          <View key={l} className="flex-row items-center">
            <Ionicons name={i} size={18} color="#1C1917" />
            <Text className="ml-2 text-xs font-bold tracking-widest text-ink">{l}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

function PageDeliver() {
  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 8 }}>
      <IllustrationCard height={220}>
        <DeliveryIllustration height={200} />
        <FloatChip label="NO MARKUP" dot="#E8590C" style={{ left: 12, top: 28 }} />
        <FloatChip label="DIRECT TILL" dot="#16A34A" style={{ right: 12, top: 12 }} />
      </IllustrationCard>
      <Text className="mt-6 text-[24px] font-extrabold leading-7 text-ink">Fast doorstep delivery.{'\n'}Pay supplier directly.</Text>
      <Text className="mt-3 text-base leading-6 text-ink-soft">
        Track your rider live to your doorstep. You pay the supplier's Till directly with zero markup. GEKEL only charges a small delivery fee.
      </Text>
      <View className="mt-4 flex-row items-start rounded-2xl bg-brand-50 p-3">
        <Ionicons name="phone-portrait" size={20} color="#E8590C" style={{ marginTop: 2 }} />
        <Text className="ml-3 flex-1 text-sm leading-5 text-ink">
          <Text className="font-bold">Verified M-Pesa push: </Text>You confirm goods before release.
        </Text>
      </View>
    </ScrollView>
  );
}

const PAGES = [PageAsk, PageFind, PageSeal, PageDeliver];

export default function OnboardingScreen() {
  const { completeOnboarding, setSignupIntent } = useAuth();
  const { width } = useWindowDimensions();
  const listRef = useRef<FlatList<number>>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const [index, setIndex] = useState(0);
  const first = index === 0;
  const last = index === TOTAL - 1;

  const onViewable = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems[0]?.index != null) setIndex(viewableItems[0].index);
  }).current;

  const go = (i: number) => listRef.current?.scrollToIndex({ index: i, animated: true });
  const next = () => (last ? completeOnboarding() : go(index + 1));
  const supplier = async () => { setSignupIntent('supplier'); await completeOnboarding(); };

  return (
    <Screen>
      {/* header */}
      <View className="h-12 flex-row items-center justify-between">
        {first ? <View /> : last ? (
          <Pressable hitSlop={12} onPress={() => go(index - 1)} accessibilityLabel="Previous step">
            <Ionicons name="arrow-back" size={22} color="#1C1917" />
          </Pressable>
        ) : (
          <Text className="text-sm font-semibold tracking-widest text-ink">STEP {index + 1} OF {TOTAL}</Text>
        )}
        {last && (
          <View className="flex-row items-center">
            <Ionicons name="shield-checkmark" size={14} color="#1C1917" />
            <Text className="ml-1.5 text-sm font-semibold tracking-widest text-ink">STEP {TOTAL} OF {TOTAL}</Text>
          </View>
        )}
        {!first && !last ? (
          <Pressable hitSlop={12} onPress={completeOnboarding} accessibilityLabel="Skip onboarding">
            <Text className="text-base font-medium text-ink">Skip</Text>
          </Pressable>
        ) : <View className="w-6" />}
      </View>

      <Animated.FlatList
        ref={listRef as any}
        data={[0, 1, 2, 3]}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        keyExtractor={(i) => String(i)}
        onViewableItemsChanged={onViewable}
        viewabilityConfig={{ viewAreaCoveragePercentThreshold: 60 }}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: false })}
        scrollEventThrottle={16}
        style={{ marginHorizontal: -24 }}
        renderItem={({ index: i }) => {
          const Page = PAGES[i];
          return <View style={{ width }} className="flex-1 px-6"><Page /></View>;
        }}
      />

      {/* dots (first page in the design, kept as a live indicator) */}
      <View className="my-4 flex-row items-center justify-center">
        {[0, 1, 2, 3].map((i) => {
          const range = [(i - 1) * width, i * width, (i + 1) * width];
          return (
            <Animated.View
              key={i}
              style={{
                width: scrollX.interpolate({ inputRange: range, outputRange: [8, 8, 8], extrapolate: 'clamp' }),
                backgroundColor: scrollX.interpolate({ inputRange: range, outputRange: ['#D6D3D1', '#E8590C', '#D6D3D1'], extrapolate: 'clamp' }),
              }}
              className="mx-1 h-2 rounded-full"
            />
          );
        })}
      </View>

      {/* footer buttons */}
      {first ? (
        <>
          <Button title="Ask GEKEL" onPress={next} />
          <Button title="I have a supplier" variant="outline" className="mt-3" onPress={supplier} />
        </>
      ) : (
        <>
          <Button title={last ? 'Get Started Now' : index === 1 ? 'Continue' : 'Next'} variant="outline" icon="arrow-forward" onPress={next} className="shadow-sm" />
          <Pressable onPress={supplier} className="mt-3 h-12 flex-row items-center justify-center">
            {last && <Ionicons name="storefront-outline" size={16} color="#1C1917" style={{ marginRight: 6 }} />}
            <Text className="text-base text-ink">{index === 1 ? 'I already have a supplier' : 'I have a supplier'}</Text>
          </Pressable>
        </>
      )}
    </Screen>
  );
}
