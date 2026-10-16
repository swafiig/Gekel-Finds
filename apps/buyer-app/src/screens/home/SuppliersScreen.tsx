import React, { useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { RouteProp, useRoute } from "@react-navigation/native";
import Screen from "../../components/Screen";
import BackHeader from "../../components/BackHeader";
import Chip from "../../components/Chip";
import Button from "../../components/Button";
import AskGekelButton from "../../components/AskGekelButton";
import Stars from "../../components/Stars";
import OnlineStatus from "../../components/OnlineStatus";
import EmptyState from "../../components/EmptyState";
import { useAppData } from "../../context/AppDataContext";
import {
  MARKETS,
  SELLER_LABEL,
  SUPPLIERS,
  categoryName,
} from "../../data/mock";
import { formatKm, haversineKm } from "../../utils/geo";
import { useNav } from "../../hooks/useNav";
import type { RootStackParamList } from "../../types/navigation";

/** Every seller on GEKEL does wholesale, so there is no "retailers" tab — just an optional filter for who also sells single pieces. */
export default function SuppliersScreen() {
  const nav = useNav();
  const params = useRoute<RouteProp<RootStackParamList, "Suppliers">>().params;
  const { openSupplierChat, userCoords, following, toggleFollow } =
    useAppData();
  const [q, setQ] = useState("");
  const [market, setMarket] = useState<string | undefined>(params?.market);
  const [retailOnly, setRetailOnly] = useState(params?.retailOnly ?? false);

  const data = useMemo(
    () =>
      SUPPLIERS.filter(
        (s) =>
          (!retailOnly || s.type === "both") &&
          (!market || s.market === market) &&
          (s.name + s.categories.join(" "))
            .toLowerCase()
            .includes(q.trim().toLowerCase()),
      ),
    [q, market, retailOnly],
  );

  return (
    <Screen>
      <BackHeader title="Suppliers" />
      <Text className="mt-2 text-sm text-ink-soft dark:text-sink-soft">
        Every seller here does wholesale. Many also sell single pieces at retail
        size.
      </Text>

      <View className="mt-4 flex-row gap-3">
        <AskGekelButton variant="compact" style={{ flex: 1 }} />
        <Button
          title="I have a supplier"
          icon="storefront-outline"
          variant="outline"
          className="h-12 flex-1 px-3"
          onPress={() => nav.navigate("OwnSupplier")}
        />
      </View>

      <View className="mt-4 h-12 flex-row items-center rounded-2xl border border-line dark:border-surface-line bg-white dark:bg-surface px-4">
        <Ionicons name="search" size={18} color={ic.faint} />
        <TextInput
          className="ml-3 flex-1 text-base text-ink dark:text-sink"
          placeholder="Search suppliers or categories"
          placeholderTextcolor={ic.faint}
          value={q}
          onChangeText={setQ}
        />
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="-mx-6 my-3 max-h-12"
        contentContainerStyle={{ paddingHorizontal: 24 }}
      >
        <Chip
          label="Retail also available"
          active={retailOnly}
          onPress={() => setRetailOnly((v) => !v)}
        />
        <Chip
          label="All markets"
          active={!market}
          onPress={() => setMarket(undefined)}
        />
        {MARKETS.map((m) => (
          <Chip
            key={m}
            label={m}
            active={market === m}
            onPress={() => setMarket(market === m ? undefined : m)}
          />
        ))}
      </ScrollView>

      <FlatList
        data={data}
        keyExtractor={(s) => s.id}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            icon="storefront-outline"
            title="No suppliers found"
            body="Try another market, or ask GEKEL to find it for you."
            cta="Ask GEKEL"
            onCta={() => nav.navigate("AskGekel")}
          />
        }
        renderItem={({ item }) => {
          const followed = following.includes(item.id);
          return (
            <Pressable
              onPress={() => nav.navigate("SupplierProfile", { id: item.id })}
              className="mb-3 rounded-2xl border border-line dark:border-surface-line bg-white dark:bg-surface p-4 active:bg-cream dark:active:bg-surface-soft"
            >
              <View className="flex-row items-center">
                <View className="h-12 w-12 items-center justify-center rounded-full bg-brand-50">
                  <Ionicons name="storefront" size={22} color="#FA3504" />
                </View>
                <View className="ml-3 flex-1">
                  <View className="flex-row items-center">
                    <Text
                      numberOfLines={1}
                      className="shrink text-base font-bold text-ink dark:text-sink"
                    >
                      {item.name}
                    </Text>
                    {item.verified && (
                      <Ionicons
                        name="shield-checkmark"
                        size={14}
                        color="#15803D"
                        style={{ marginLeft: 6 }}
                      />
                    )}
                  </View>
                  <View className="mt-0.5 flex-row items-center">
                    <Stars value={item.rating} size={12} />
                    <Text className="ml-1.5 text-xs font-semibold text-ink dark:text-sink">
                      {item.rating}
                    </Text>
                    <Text className="ml-1 text-xs text-ink-mute dark:text-sink-mute">
                      ({item.reviewCount})
                    </Text>
                  </View>
                </View>
                <Pressable
                  hitSlop={8}
                  onPress={() => toggleFollow(item.id)}
                  className={`mr-1 h-8 flex-row items-center rounded-full px-2.5 ${followed ? "bg-cream dark:bg-surface-soft" : "bg-brand-50"}`}
                >
                  <Ionicons
                    name={followed ? "checkmark" : "add"}
                    size={12}
                    color="#FA3504"
                  />
                  <Text className="ml-1 text-[11px] font-bold text-brand-600">
                    {followed ? "Following" : "Follow"}
                  </Text>
                </Pressable>
              </View>
              <View className="mt-3 flex-row flex-wrap items-center gap-2">
                <View className="rounded-full bg-ink px-2.5 py-1">
                  <Text className="text-xs font-semibold text-white">
                    {SELLER_LABEL[item.type]}
                  </Text>
                </View>
                <View className="rounded-full bg-cream dark:bg-surface-soft px-2.5 py-1">
                  <Text className="text-xs font-semibold text-ink-soft dark:text-sink-soft">
                    {item.market}
                    {userCoords
                      ? ` · ${formatKm(haversineKm(userCoords, item.location))}`
                      : ""}
                  </Text>
                </View>
                {item.categories.map((c) => (
                  <View
                    key={c}
                    className="rounded-full bg-cream dark:bg-surface-soft px-2.5 py-1"
                  >
                    <Text className="text-xs font-semibold text-ink-soft dark:text-sink-soft">
                      {categoryName(c)}
                    </Text>
                  </View>
                ))}
              </View>
              <View className="mt-3 flex-row items-center justify-between">
                <OnlineStatus online={item.online} lastSeen={item.lastSeen} />
                <Pressable
                  hitSlop={8}
                  onPress={() =>
                    nav.navigate("ChatRoom", { id: openSupplierChat(item.id) })
                  }
                  className="flex-row items-center"
                >
                  <Ionicons
                    name="chatbubble-ellipses-outline"
                    size={16}
                    color="#FA3504"
                  />
                  <Text className="ml-1 text-sm font-semibold text-brand-600">
                    Message
                  </Text>
                </Pressable>
              </View>
            </Pressable>
          );
        }}
      />
    </Screen>
  );
}
