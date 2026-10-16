import React from "react";
import { Alert, FlatList, Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Screen from "../../components/Screen";
import BackHeader from "../../components/BackHeader";
import Button from "../../components/Button";
import EmptyState from "../../components/EmptyState";
import { formatAddress, useAppData } from "../../context/AppDataContext";
import { useNav } from "../../hooks/useNav";

export default function AddressesScreen() {
  const nav = useNav();
  const { addresses, setDefaultAddress, deleteAddress } = useAppData();
  const confirmDelete = (id: string) =>
    Alert.alert("Delete address?", "You can add it again later.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => deleteAddress(id),
      },
    ]);

  return (
    <Screen>
      <BackHeader title="Saved addresses" />
      <FlatList
        className="mt-4"
        data={addresses}
        keyExtractor={(a) => a.id}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            icon="location-outline"
            title="No addresses yet"
            body="Add where you want your finds delivered. Use GPS or drop a pin on the map."
          />
        }
        renderItem={({ item: a }) => (
          <View
            className={`mb-3 rounded-2xl border bg-white p-4 ${a.isDefault ? "border-brand-500" : "border-line"}`}
          >
            <View className="flex-row items-center">
              <View className="h-10 w-10 items-center justify-center rounded-full bg-brand-50">
                <Ionicons
                  name={
                    a.label === "Home"
                      ? "home"
                      : a.label === "Work"
                        ? "briefcase"
                        : "location"
                  }
                  size={19}
                  color="#FA3504"
                />
              </View>
              <Text className="ml-3 flex-1 text-base font-extrabold text-ink">
                {a.label} · {a.area}
              </Text>
              {a.isDefault && (
                <View className="rounded-full bg-brand-500 px-2.5 py-1">
                  <Text className="text-[10px] font-bold text-white">
                    DEFAULT
                  </Text>
                </View>
              )}
            </View>
            <Text className="mt-2 text-sm leading-5 text-ink-soft">
              {formatAddress(a)}
            </Text>
            <Text className="mt-1 text-xs text-ink-mute">
              {a.phone}
              {a.lat ? "  ·  📍 pinned" : ""}
            </Text>
            <View className="mt-3 flex-row items-center gap-5">
              {!a.isDefault && (
                <Pressable hitSlop={8} onPress={() => setDefaultAddress(a.id)}>
                  <Text className="text-sm font-bold text-brand-600">
                    Set default
                  </Text>
                </Pressable>
              )}
              <Pressable
                hitSlop={8}
                onPress={() => nav.navigate("AddressForm", { id: a.id })}
              >
                <Text className="text-sm font-bold text-ink-soft">Edit</Text>
              </Pressable>
              <Pressable hitSlop={8} onPress={() => confirmDelete(a.id)}>
                <Text className="text-sm font-bold text-danger">Delete</Text>
              </Pressable>
            </View>
          </View>
        )}
      />
      <Button
        title="Add new address"
        icon="add"
        onPress={() => nav.navigate("AddressForm", {})}
      />
    </Screen>
  );
}
