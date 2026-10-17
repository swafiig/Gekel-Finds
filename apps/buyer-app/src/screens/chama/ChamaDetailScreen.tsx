import React, { useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  Share,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { RouteProp, useRoute } from "@react-navigation/native";
import Screen from "../../components/Screen";
import BackHeader from "../../components/BackHeader";
import Button from "../../components/Button";
import ProductImage from "../../components/ProductImage";
import { useAppData } from "../../context/AppDataContext";
import { PRODUCTS, formatKsh } from "../../data/mock";
import { isKenyanPhone } from "../../utils/validation";
import { useNav } from "../../hooks/useNav";
import type { RootStackParamList } from "../../types/navigation";
import { useIconColor } from "../../hooks/useIconColor";

export default function ChamaDetailScreen() {
  const nav = useNav();
  const ic = useIconColor();
  const { id } =
    useRoute<RouteProp<RootStackParamList, "ChamaDetail">>().params;
  const {
    chamas,
    addresses,
    defaultAddress,
    addChamaMember,
    removeChamaMember,
    setChamaPayer,
    markMemberPaid,
    placeChamaOrder,
  } = useAppData();
  const chama = chamas.find((c) => c.id === id)!;
  const product = PRODUCTS.find((p) => p.id === chama.productId)!;
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [qty, setQty] = useState("5");
  const [error, setError] = useState<string>();

  const have = chama.members.reduce((n, m) => n + m.qty, 0);
  const ready = have >= chama.targetQty;
  const allPaid =
    chama.payMode === "pre"
      ? chama.members.every((m) => m.paid)
      : !!chama.payerMemberId;

  const add = () => {
    const q = Number(qty);
    if (name.trim().length < 2) return setError("Enter their name");
    if (!isKenyanPhone(phone)) return setError("Enter a valid phone number");
    if (!q || q < 1) return setError("Enter how many pieces they want");
    addChamaMember(id, {
      name: name.trim(),
      phone: phone.replace(/[\s-]/g, ""),
      qty: q,
    });
    setName("");
    setPhone("");
    setQty("5");
    setError(undefined);
  };

  const invite = () =>
    Share.share({
      message: `Join our Chama Buy for ${product.name} on GEKEL — we need ${chama.targetQty - have} more pieces to unlock the wholesale price of ${formatKsh(chama.unitPrice)} each.`,
    });

  const place = () => {
    if (!allPaid)
      return Alert.alert(
        "Not fully paid",
        chama.payMode === "pre"
          ? "Everyone needs to be marked paid first."
          : "Choose who will pay on delivery first.",
      );
    if (!defaultAddress)
      return Alert.alert(
        "Add an address",
        "Set a default delivery address first.",
      );
    placeChamaOrder(id, defaultAddress);
    Alert.alert(
      "Order placed!",
      "This group order is now on its way to the supplier.",
      [{ text: "OK", onPress: () => nav.goBack() }],
    );
  };

  return (
    <Screen scroll>
      <BackHeader title="Chama Buy" />
      <View className="mt-4 flex-row items-center rounded-2xl border border-line dark:border-surface-line bg-white dark:bg-surface p-3">
        <View className="h-14 w-14 overflow-hidden rounded-xl">
          <ProductImage product={product} height={56} artSize={40} />
        </View>
        <View className="ml-3 flex-1">
          <Text className="text-base font-bold text-ink dark:text-sink">
            {product.name}
          </Text>
          <Text className="text-sm text-ink-soft dark:text-sink-soft">
            {formatKsh(chama.unitPrice)} each once full
          </Text>
        </View>
      </View>

      <View className="mt-4 rounded-2xl bg-brand-500 p-4">
        <View className="flex-row items-center justify-between">
          <Text className="text-sm text-white-85">Progress</Text>
          <Text className="text-sm font-bold text-white">
            {have} of {chama.targetQty}
          </Text>
        </View>
        <View className="mt-2 h-2.5 overflow-hidden rounded-full bg-white-25">
          <View
            style={{
              width: `${Math.min(100, (have / chama.targetQty) * 100)}%`,
            }}
            className="h-full rounded-full bg-white"
          />
        </View>
      </View>

      <Text className="mb-3 mt-6 text-lg font-extrabold text-ink dark:text-sink">
        Members
      </Text>
      {chama.members.length === 0 && (
        <Text className="mb-3 text-sm text-ink-soft dark:text-sink-soft">
          No one added yet. Add people below, or share the invite link.
        </Text>
      )}
      {chama.members.map((m) => (
        <View
          key={m.id}
          className="mb-2 flex-row items-center rounded-2xl border border-line dark:border-surface-line bg-white dark:bg-surface p-3"
        >
          <View className="h-10 w-10 items-center justify-center rounded-full bg-brand-50">
            <Text className="font-bold text-brand-600">{m.name.charAt(0)}</Text>
          </View>
          <View className="ml-3 flex-1">
            <Text className="text-base font-bold text-ink dark:text-sink">
              {m.name}
            </Text>
            <Text className="text-sm text-ink-soft dark:text-sink-soft">
              {m.qty} pieces · {m.phone}
            </Text>
          </View>
          {chama.payMode === "pre" ? (
            <Pressable
              onPress={() => markMemberPaid(id, m.id)}
              disabled={m.paid}
              className={`rounded-full px-3 py-1.5 ${m.paid ? "bg-green-100" : "bg-amber-50"}`}
            >
              <Text
                className={`text-xs font-bold ${m.paid ? "text-success" : "text-amber-700"}`}
              >
                {m.paid ? "Paid" : "Mark paid"}
              </Text>
            </Pressable>
          ) : (
            <Pressable
              onPress={() => setChamaPayer(id, m.id)}
              className={`rounded-full px-3 py-1.5 ${chama.payerMemberId === m.id ? "bg-brand-500" : "bg-cream dark:bg-surface-soft"}`}
            >
              <Text
                className={`text-xs font-bold ${chama.payerMemberId === m.id ? "text-white" : "text-ink-soft dark:text-sink-soft"}`}
              >
                {chama.payerMemberId === m.id ? "Will pay" : "Make payer"}
              </Text>
            </Pressable>
          )}
          <Pressable
            hitSlop={8}
            onPress={() => removeChamaMember(id, m.id)}
            className="ml-2"
          >
            <Ionicons name="close-circle" size={18} color={ic.faint} />
          </Pressable>
        </View>
      ))}

      <View className="mt-3 rounded-2xl border border-dashed border-brand-300 bg-brand-50 p-4">
        <Text className="mb-2 text-sm font-bold text-ink">Add a member</Text>
        {error && <Text className="mb-2 text-xs text-danger">{error}</Text>}
        <View className="mb-2 h-12 flex-row items-center rounded-xl bg-white px-3">
          <Ionicons name="person-outline" size={16} color={ic.faint} />
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Name"
            placeholderTextColor={ic.faint}
            className="ml-2 flex-1 text-sm text-ink"
          />
        </View>
        <View className="mb-2 h-12 flex-row items-center rounded-xl bg-white px-3">
          <Ionicons name="call-outline" size={16} color={ic.faint} />
          <TextInput
            value={phone}
            onChangeText={setPhone}
            placeholder="Phone — paste from Contacts"
            placeholderTextColor={ic.faint}
            keyboardType="phone-pad"
            className="ml-2 flex-1 text-sm text-ink"
          />
        </View>
        <View className="mb-3 h-12 flex-row items-center rounded-xl bg-white px-3">
          <Ionicons name="cube-outline" size={16} color={ic.faint} />
          <TextInput
            value={qty}
            onChangeText={setQty}
            placeholder="How many pieces"
            placeholderTextColor={ic.faint}
            keyboardType="number-pad"
            className="ml-2 flex-1 text-sm text-ink"
          />
        </View>
        <View className="flex-row gap-3">
          <Button title="Add" className="h-11 flex-1" onPress={add} />
          <Button
            title="Share invite"
            icon="share-social-outline"
            variant="outline"
            className="h-11 flex-1"
            onPress={invite}
          />
        </View>
      </View>

      <Button
        title={
          ready
            ? allPaid
              ? "Place group order"
              : chama.payMode === "pre"
                ? "Waiting for everyone to pay"
                : "Choose who pays first"
            : `Need ${chama.targetQty - have} more pieces`
        }
        disabled={!ready || !allPaid}
        className="mt-6"
        onPress={place}
      />
    </Screen>
  );
}
