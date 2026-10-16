import React from "react";
import {
  Linking,
  Pressable,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { RouteProp, useRoute } from "@react-navigation/native";
import Button from "../../components/Button";
import Stars from "../../components/Stars";
import OnlineStatus from "../../components/OnlineStatus";
import ProductCard from "../../components/ProductCard";
import EmptyState from "../../components/EmptyState";
import { useAppData } from "../../context/AppDataContext";
import {
  PRODUCTS,
  SAMPLE_REVIEWS,
  SELLER_LABEL,
  SUPPLIERS,
} from "../../data/mock";
import { useNav } from "../../hooks/useNav";
import { LOGO_BG } from "../../theme";
import { formatKm, haversineKm } from "../../utils/geo";
import type { RootStackParamList } from "../../types/navigation";

export default function SupplierProfileScreen() {
  const nav = useNav();
  const { width } = useWindowDimensions();
  const { id } =
    useRoute<RouteProp<RootStackParamList, "SupplierProfile">>().params;
  const { openSupplierChat, userCoords } = useAppData();
  const s = SUPPLIERS.find((x) => x.id === id)!;
  const catalogue = PRODUCTS.filter((p) => p.supplierId === id);
  const cardW = (width - 40 - 12) / 2;
  // Rough distribution derived from the average — replace with real data from your API
  const dist = [0.7, 0.2, 0.06, 0.03, 0.01].map((v, i) => ({
    star: 5 - i,
    pct: v,
  }));

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="light" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <View
          style={{ backgroundColor: LOGO_BG }}
          className="rounded-b-[32px] pb-8"
        >
          <View
            pointerEvents="none"
            className="absolute -right-16 -top-10 h-56 w-56 rounded-full bg-white-10"
          />
          <SafeAreaView edges={["top"]}>
            <View className="px-5 pt-2">
              <Pressable
                onPress={() => nav.goBack()}
                accessibilityLabel="Go back"
                className="h-10 w-10 items-center justify-center rounded-full bg-white-20"
              >
                <Ionicons name="arrow-back" size={20} color="#fff" />
              </Pressable>
              <View className="mt-4 flex-row items-center">
                <View className="h-20 w-20 items-center justify-center rounded-3xl bg-white">
                  <Ionicons name="storefront" size={36} color="#FA3504" />
                </View>
                <View className="ml-4 flex-1">
                  <View className="flex-row items-center">
                    <Text
                      numberOfLines={2}
                      className="shrink text-2xl font-extrabold leading-7 text-white"
                    >
                      {s.name}
                    </Text>
                    {s.verified && (
                      <Ionicons
                        name="shield-checkmark"
                        size={18}
                        color="#fff"
                        style={{ marginLeft: 6 }}
                      />
                    )}
                  </View>
                  <Text className="mt-0.5 text-sm text-white-90">
                    {s.market} · {SELLER_LABEL[s.type]}
                  </Text>
                  <View className="mt-1.5">
                    <OnlineStatus
                      online={s.online}
                      lastSeen={s.lastSeen}
                      light
                    />
                  </View>
                </View>
              </View>
            </View>
          </SafeAreaView>
        </View>

        <View className="-mt-5 mx-5 flex-row rounded-2xl border border-line bg-white py-4">
          {[
            [`★ ${s.rating}`, `${s.reviewCount} reviews`],
            [`~${s.responseMins} min`, "Reply time"],
            [s.since, "Selling since"],
          ].map(([a, b], i) => (
            <View
              key={b}
              className={`flex-1 items-center ${i > 0 ? "border-l border-line" : ""}`}
            >
              <Text className="text-lg font-extrabold text-ink">{a}</Text>
              <Text className="text-xs text-ink-soft">{b}</Text>
            </View>
          ))}
        </View>

        <View className="mt-5 flex-row gap-3 px-5">
          <Button
            title="Message"
            icon="chatbubble-ellipses-outline"
            className="h-12 flex-1"
            onPress={() =>
              nav.navigate("ChatRoom", { id: openSupplierChat(s.id) })
            }
          />
          <Button
            title="Call"
            icon="call-outline"
            variant="outline"
            className="h-12 flex-1"
            onPress={() =>
              nav.navigate("Call", {
                name: s.name,
                role: `Supplier · ${s.market}`,
              })
            }
          />
        </View>

        <View className="px-5">
          <Text className="mb-2 mt-6 text-lg font-bold text-ink">About</Text>
          <Text className="text-base leading-6 text-ink-soft">{s.about}</Text>

          <Text className="mb-3 mt-6 text-lg font-extrabold text-ink">
            Shop location
          </Text>
          <View className="rounded-2xl border border-line dark:border-surface-line bg-white dark:bg-surface p-4">
            <View className="flex-row items-start">
              <View className="h-10 w-10 items-center justify-center rounded-full bg-brand-50">
                <Ionicons name="location" size={20} color="#FA3504" />
              </View>
              <View className="ml-3 flex-1">
                <Text className="text-base font-bold text-ink">
                  {s.location.building}
                </Text>
                <Text className="text-sm text-ink-soft">
                  {[s.location.floor, s.location.shop]
                    .filter(Boolean)
                    .join(" · ")}
                </Text>
                <Text className="mt-1 text-sm text-ink-soft">
                  {s.location.landmark}
                </Text>
                {userCoords ? (
                  <Text className="mt-1 text-sm font-bold text-brand-600">
                    {formatKm(haversineKm(userCoords, s.location))} from you
                  </Text>
                ) : null}
              </View>
            </View>
            <View className="mt-3 flex-row gap-3">
              <Button
                title="Directions"
                icon="navigate"
                className="h-11 flex-1"
                onPress={() =>
                  Linking.openURL(
                    `https://www.google.com/maps/dir/?api=1&destination=${s.location.lat},${s.location.lng}`,
                  )
                }
              />
              <Button
                title="View on map"
                icon="map-outline"
                variant="outline"
                className="h-11 flex-1"
                onPress={() =>
                  Linking.openURL(
                    `https://www.google.com/maps/search/?api=1&query=${s.location.lat},${s.location.lng}`,
                  )
                }
              />
            </View>
            <Text className="mt-2 text-xs text-ink-mute">
              Want to see goods in person? Visit the shop. Pin is approximate,
              confirm with the seller first.
            </Text>
          </View>

          <Text className="mb-3 mt-6 text-lg font-bold text-ink">
            Catalogue
          </Text>
          {catalogue.length === 0 ? (
            <EmptyState
              icon="pricetags-outline"
              title="Catalogue coming soon"
              body="Ask GEKEL for anything this supplier stocks."
              cta="Ask GEKEL"
              onCta={() => nav.navigate("AskGekel")}
            />
          ) : (
            <View className="flex-row flex-wrap gap-3">
              {catalogue.map((p) => (
                <ProductCard
                  key={p.id}
                  item={p}
                  width={cardW}
                  imageHeight={110}
                  onPress={() => nav.navigate("ProductDetail", { id: p.id })}
                />
              ))}
            </View>
          )}

          <Text className="mb-3 mt-8 text-lg font-bold text-ink">
            Ratings & reviews
          </Text>
          <View className="flex-row items-center">
            <View className="mr-5 items-center">
              <Text className="text-5xl font-extrabold text-ink">
                {s.rating}
              </Text>
              <Stars value={s.rating} size={14} />
              <Text className="mt-1 text-xs text-ink-soft">
                {s.reviewCount} reviews
              </Text>
            </View>
            <View className="flex-1">
              {dist.map((d) => (
                <View key={d.star} className="my-0.5 flex-row items-center">
                  <Text className="w-3 text-xs text-ink-soft">{d.star}</Text>
                  <View className="mx-2 h-2 flex-1 overflow-hidden rounded-full bg-line">
                    <View
                      style={{ width: `${d.pct * 100}%` }}
                      className="h-full rounded-full bg-[#F5A623]"
                    />
                  </View>
                </View>
              ))}
            </View>
          </View>
          {SAMPLE_REVIEWS.map((r) => (
            <View key={r.id} className="mt-4 rounded-2xl bg-cream p-4">
              <View className="flex-row items-center justify-between">
                <Text className="text-sm font-bold text-ink">{r.name}</Text>
                <Text className="text-xs text-ink-mute">{r.when}</Text>
              </View>
              <View className="my-1">
                <Stars value={r.stars} size={12} />
              </View>
              <Text className="text-sm leading-5 text-ink-soft">{r.text}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
