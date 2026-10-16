import React, { useRef, useState } from "react";
import { ScrollView, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Screen from "../../components/Screen";
import BackHeader from "../../components/BackHeader";
import Input from "../../components/Input";
import Button from "../../components/Button";
import Chip from "../../components/Chip";
import { useAppData } from "../../context/AppDataContext";
import { MARKETS } from "../../data/mock";
import { isKenyanPhone } from "../../utils/validation";
import { useNav } from "../../hooks/useNav";

type Errors = Partial<Record<"name" | "phone" | "location" | "items", string>>;

/** "I have a supplier": the buyer already knows where to buy. GEKEL picks up and delivers. */
export default function OwnSupplierScreen() {
  const nav = useNav();
  const { addRequest } = useAppData();
  const phoneRef = useRef<TextInput>(null);
  const [f, setF] = useState({ name: "", phone: "", till: "", items: "" });
  const [location, setLocation] = useState<string>();
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);
  const set = (k: keyof typeof f) => (v: string) => {
    setF((p) => ({ ...p, [k]: v }));
    setErrors((p) => ({ ...p, [k]: undefined }));
  };

  const submit = () => {
    const e: Errors = {};
    if (f.name.trim().length < 2) e.name = "Enter your supplier's name or shop";
    if (!isKenyanPhone(f.phone)) e.phone = "Enter a valid phone number";
    if (!location) e.location = "Pick the market or area";
    if (f.items.trim().length < 3) e.items = "Tell us what to pick up";
    setErrors(e);
    if (Object.keys(e).length) return;
    setLoading(true);
    // TODO: POST /requests { kind: 'ownSupplier', ... }
    const id = addRequest({
      title: `Pick up from ${f.name.trim()}: ${f.items.trim()}`,
      kind: "ownSupplier",
      urgency: "sameDay",
      supplier: {
        name: f.name.trim(),
        phone: f.phone.replace(/[\s-]/g, ""),
        location: location!,
        till: f.till.trim() || undefined,
      },
    });
    setLoading(false);
    nav.replace("RequestDetail", { id });
  };

  return (
    <Screen scroll>
      <BackHeader title="I have a supplier" />
      <Text className="mb-6 mt-4 text-base leading-6 text-ink-soft">
        Already know who to buy from? Give us their details. A GEKEL shopper
        collects the goods, checks and seals them, and a rider delivers.
      </Text>

      <Input
        label="Supplier or shop name"
        icon="storefront-outline"
        placeholder="Mama Njeri Shoes"
        autoCapitalize="words"
        value={f.name}
        onChangeText={set("name")}
        error={errors.name}
        returnKeyType="next"
        onSubmitEditing={() => phoneRef.current?.focus()}
      />
      <Input
        ref={phoneRef}
        label="Supplier phone"
        icon="call-outline"
        placeholder="0712 345 678"
        keyboardType="phone-pad"
        value={f.phone}
        onChangeText={set("phone")}
        error={errors.phone}
      />

      <Text className="mb-2 text-sm font-medium text-ink">Where are they?</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="-mx-6 mb-1"
        contentContainerStyle={{ paddingHorizontal: 24 }}
      >
        {[...MARKETS, "Other"].map((m) => (
          <Chip
            key={m}
            label={m}
            active={location === m}
            onPress={() => {
              setLocation(m);
              setErrors((p) => ({ ...p, location: undefined }));
            }}
          />
        ))}
      </ScrollView>
      {errors.location && (
        <Text className="mb-3 text-sm text-danger">{errors.location}</Text>
      )}

      <View className="mt-3" />
      <Input
        label="Supplier's Till number (optional)"
        icon="keypad-outline"
        placeholder="5123401"
        keyboardType="number-pad"
        value={f.till}
        onChangeText={set("till")}
        hint="So you can pay them directly"
      />

      <Text className="mb-1.5 text-sm font-medium text-ink">
        What should we pick up?
      </Text>
      <View
        className={`mb-5 min-h-[96px] rounded-2xl border bg-white px-4 py-3 ${errors.items ? "border-danger" : "border-line"}`}
      >
        <TextInput
          multiline
          value={f.items}
          onChangeText={set("items")}
          placeholder="2 pairs of size 42 black sneakers"
          placeholderTextcolor={ic.faint}
          className="text-base text-ink"
          style={{ minHeight: 70, textAlignVertical: "top" }}
        />
      </View>
      {errors.items && (
        <Text className="-mt-3 mb-3 text-sm text-danger">{errors.items}</Text>
      )}

      <View className="mb-5 flex-row items-start rounded-2xl bg-brand-50 p-3">
        <Ionicons
          name="information-circle"
          size={18}
          color="#FA3504"
          style={{ marginTop: 1 }}
        />
        <Text className="ml-3 flex-1 text-sm leading-5 text-ink">
          You only pay the supplier plus our small delivery fee. No markup on
          the goods.
        </Text>
      </View>

      <Button title="Send pickup request" onPress={submit} loading={loading} />
    </Screen>
  );
}
