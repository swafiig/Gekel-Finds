import React, { useState } from "react";
import { FlatList, Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import ProductImage from "../../components/ProductImage";
import EmptyState from "../../components/EmptyState";
import {
  isActive,
  orderStages,
  useAppData,
} from "../../context/AppDataContext";
import {
  DELIVERED,
  PRODUCTS,
  SUPPLIERS,
  formatKsh,
  timeAgo,
} from "../../data/mock";
import { useNav } from "../../hooks/useNav";

export default function OrdersScreen() {
  const nav = useNav();
  const { orders } = useAppData();
  const [tab, setTab] = useState<"active" | "past">("active");
  const data = orders.filter((o) =>
    tab === "active" ? isActive(o) : !isActive(o),
  );

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-surface" edges={["top"]}>
      <Text className="px-5 pt-3 text-[28px] font-extrabold text-ink">
        Orders
      </Text>
      <View className="mx-5 my-4 flex-row rounded-full bg-cream p-1">
        {(["active", "past"] as const).map((t) => (
          <Pressable
            key={t}
            onPress={() => setTab(t)}
            className={`h-10 flex-1 items-center justify-center rounded-full ${tab === t ? "bg-white" : ""}`}
          >
            <Text
              className={`text-sm font-semibold ${tab === t ? "text-ink" : "text-ink-mute"}`}
            >
              {t === "active" ? "Active" : "Past"}
            </Text>
          </Pressable>
        ))}
      </View>
      <FlatList
        data={data}
        keyExtractor={(o) => o.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
        ListEmptyComponent={
          <EmptyState
            icon="bag-handle"
            title={tab === "active" ? "No active orders" : "No past orders"}
            body="Order a find and you can track your rider or courier here."
            cta="Browse finds"
            onCta={() => nav.navigate("Main", { screen: "Finds" })}
          />
        }
        renderItem={({ item }) => {
          const p = PRODUCTS.find((x) => x.id === item.items[0].productId)!;
          const s = SUPPLIERS.find((x) => x.id === item.supplierId)!;
          const stages = orderStages(item);
          const done = item.stage === DELIVERED;
          const more =
            item.items.length > 1 ? ` +${item.items.length - 1} more` : "";
          return (
            <Pressable
              onPress={() => nav.navigate("OrderDetail", { id: item.id })}
              className="mb-3 rounded-2xl border border-line bg-white p-3 active:bg-cream"
            >
              <View className="flex-row items-center">
                <View className="h-16 w-16 overflow-hidden rounded-xl">
                  <ProductImage product={p} height={64} artSize={44} />
                </View>
                <View className="ml-3 flex-1">
                  <Text
                    numberOfLines={1}
                    className="text-base font-bold text-ink"
                  >
                    {p.name}
                    {more}
                  </Text>
                  <Text numberOfLines={1} className="text-sm text-ink-soft">
                    {s.name} · {timeAgo(item.createdAt)}
                  </Text>
                  <Text
                    className={`mt-0.5 text-sm font-semibold ${item.cancelled ? "text-stone-500" : done ? "text-success" : "text-brand-600"}`}
                  >
                    {item.cancelled ? "Cancelled" : stages[item.stage]}
                    {!item.cancelled &&
                    !done &&
                    item.etaMinutes > 0 &&
                    item.delivery.method === "rider"
                      ? ` · ${item.etaMinutes} min`
                      : ""}
                  </Text>
                </View>
                <View className="items-end">
                  <Text className="text-sm font-extrabold text-ink">
                    {formatKsh(item.price + item.deliveryFee + item.serviceFee)}
                  </Text>
                  {item.delivery.method === "courier" ? (
                    <Ionicons name="cube-outline" size={16} color={ic.faint} />
                  ) : item.delivery.speed === "express" ? (
                    <Ionicons name="flash" size={16} color="#FA3504" />
                  ) : null}
                </View>
              </View>
              <View className="mt-3 flex-row gap-1">
                {stages.map((_, i) => (
                  <View
                    key={i}
                    className={`h-1.5 flex-1 rounded-full ${!item.cancelled && i <= item.stage ? (done ? "bg-success" : "bg-brand-500") : "bg-line"}`}
                  />
                ))}
              </View>
              {item.stops > 1 && (
                <Text className="mt-2 text-xs font-semibold text-brand-600">
                  Combined order · {item.stops} shops
                </Text>
              )}
            </Pressable>
          );
        }}
      />
    </SafeAreaView>
  );
}
