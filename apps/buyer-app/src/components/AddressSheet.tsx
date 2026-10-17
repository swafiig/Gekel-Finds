import React from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAppData, formatAddress } from "../context/AppDataContext";
import { useNav } from "../hooks/useNav";
import { useIconColor } from "../hooks/useIconColor";

/** Bottom sheet to pick where GEKEL delivers. Selecting an address makes it the default. */
export default function AddressSheet({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const nav = useNav();
  const { addresses, setDefaultAddress } = useAppData();
  const ic = useIconColor();

  const useHere = () => {
    onClose();
    nav.navigate("AddressForm", {});
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black-40">
        <Pressable className="flex-1" onPress={onClose} />
        <View className="rounded-t-[28px] bg-white px-5 pb-8 pt-3">
          <View className="mb-3 h-1.5 w-12 self-center rounded-full bg-line" />
          <Text className="text-xl font-extrabold text-ink">Deliver to</Text>
          <Text className="mb-3 mt-1 text-sm text-ink-soft">
            Pick an address or add a new one. We show shops and delivery fees
            for it.
          </Text>
          {addresses.map((a) => (
            <Pressable
              key={a.id}
              onPress={() => {
                setDefaultAddress(a.id);
                onClose();
              }}
              className={`mb-2 flex-row items-center rounded-2xl border p-3.5 ${a.isDefault ? "border-brand-500 bg-brand-50" : "border-line"}`}
            >
              <Ionicons
                name={
                  a.label === "Home"
                    ? "home"
                    : a.label === "Work"
                      ? "briefcase"
                      : "location"
                }
                size={20}
                color={a.isDefault ? "#FA3504" : "#57534E"}
              />
              <View className="ml-3 flex-1">
                <Text className="text-base font-bold text-ink">
                  {a.label} · {a.area}
                </Text>
                <Text numberOfLines={1} className="text-sm text-ink-soft">
                  {formatAddress(a)}
                </Text>
              </View>
              {a.isDefault && (
                <Ionicons name="checkmark-circle" size={20} color="#FA3504" />
              )}
            </Pressable>
          ))}
          <Pressable
            onPress={() => {
              onClose();
              nav.navigate("AddressForm", {});
            }}
            className="mt-1 h-12 flex-row items-center justify-center rounded-2xl border border-dashed border-brand-400 bg-brand-50"
          >
            <Ionicons name="add" size={18} color="#FA3504" />
            <Text className="ml-1 text-sm font-bold text-brand-600">
              Add a new address
            </Text>
          </Pressable>
          <Pressable
            onPress={useHere}
            className="mt-3 h-11 flex-row items-center justify-center"
          >
            <Ionicons name="navigate" size={16} color={ic.muted} />
            <Text className="ml-2 text-sm font-semibold text-ink-soft">
              Use my current location
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
