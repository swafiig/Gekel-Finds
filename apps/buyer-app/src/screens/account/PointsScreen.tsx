import React from "react";
import { Alert, FlatList, Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Screen from "../../components/Screen";
import BackHeader from "../../components/BackHeader";
import { useAppData } from "../../context/AppDataContext";
import { REWARDS } from "../../data/mock";

const WAYS_TO_EARN: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
}[] = [
  {
    icon: "checkmark-done",
    title: "Every delivered order",
    body: "About 1 point per KSh 100 spent, plus a flat bonus",
  },
  {
    icon: "star",
    title: "Rate your order",
    body: "A few points for rating the supplier and rider",
  },
  {
    icon: "people",
    title: "Join or start a Chama Buy",
    body: "Bonus points when the group order is placed",
  },
  {
    icon: "person-add",
    title: "Invite a friend",
    body: "Points when they place their first order (coming soon)",
  },
];

export default function PointsScreen() {
  const { points, redeemPoints } = useAppData();

  const redeem = (id: string, title: string, cost: number) => {
    if (points < cost)
      return Alert.alert(
        "Not enough points",
        `You need ${(cost - points).toLocaleString("en-KE")} more points for this.`,
      );
    Alert.alert("Redeem this reward?", title, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Redeem",
        onPress: () => {
          if (redeemPoints(cost, title))
            Alert.alert("Redeemed! 🎉", `${title} will apply automatically.`);
        },
      },
    ]);
  };

  return (
    <Screen scroll>
      <BackHeader title="GEKEL Points" />
      <View className="mt-4 items-center rounded-2xl bg-brand-500 py-7">
        <Text className="text-sm font-semibold text-white-85">
          YOUR BALANCE
        </Text>
        <Text className="mt-1 text-4xl font-extrabold text-white">
          {points.toLocaleString("en-KE")}
        </Text>
        <Text className="text-sm text-white-85">points</Text>
      </View>

      <Text className="mb-3 mt-6 text-lg font-extrabold text-ink dark:text-sink">
        Redeem
      </Text>
      <FlatList
        data={REWARDS}
        keyExtractor={(r) => r.id}
        scrollEnabled={false}
        renderItem={({ item }) => (
          <View className="mb-3 flex-row items-center rounded-2xl border border-line dark:border-surface-line bg-white dark:bg-surface p-4">
            <View className="h-11 w-11 items-center justify-center rounded-full bg-brand-50">
              <Ionicons name={item.icon as any} size={20} color="#FA3504" />
            </View>
            <View className="ml-3 flex-1">
              <Text className="text-base font-bold text-ink dark:text-sink">
                {item.title}
              </Text>
              <Text className="text-sm text-ink-soft dark:text-sink-soft">
                {item.cost.toLocaleString("en-KE")} points
              </Text>
            </View>
            <Pressable
              onPress={() => redeem(item.id, item.title, item.cost)}
              disabled={points < item.cost}
              className={`rounded-full px-4 py-2 ${points < item.cost ? "bg-line dark:bg-surface-line" : "bg-brand-500"}`}
            >
              <Text
                className={`text-xs font-extrabold ${points < item.cost ? "text-ink-mute dark:text-sink-mute" : "text-white"}`}
              >
                Redeem
              </Text>
            </Pressable>
          </View>
        )}
      />

      <Text className="mb-3 mt-6 text-lg font-extrabold text-ink dark:text-sink">
        Ways to earn
      </Text>
      {WAYS_TO_EARN.map((w) => (
        <View
          key={w.title}
          className="mb-3 flex-row items-start rounded-2xl bg-cream dark:bg-surface-soft p-4"
        >
          <Ionicons
            name={w.icon}
            size={18}
            color="#FA3504"
            style={{ marginTop: 2 }}
          />
          <View className="ml-3 flex-1">
            <Text className="text-sm font-bold text-ink dark:text-sink">
              {w.title}
            </Text>
            <Text className="text-xs leading-5 text-ink-soft dark:text-sink-soft">
              {w.body}
            </Text>
          </View>
        </View>
      ))}
    </Screen>
  );
}
