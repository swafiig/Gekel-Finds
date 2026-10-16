import React, { useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import Screen from "../../components/Screen";
import BackHeader from "../../components/BackHeader";
import Button from "../../components/Button";
import EmptyState from "../../components/EmptyState";

import { ERRAND_STAGES, useAppData } from "../../context/AppDataContext";
import { timeAgo } from "../../data/mock";
import { useNav } from "../../hooks/useNav";

// Update these import paths if your project uses different paths.

type ErrandTypeId = "collect" | "documents" | "delivery" | "business" | "other";

type Urgency = "standard" | "today" | "urgent";

const CATEGORIES: {
  id: ErrandTypeId;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  fee: number;
}[] = [
  {
    id: "collect",
    title: "Collect something",
    description: "Pick up an item or order",
    icon: "cube-outline",
    fee: 100,
  },
  {
    id: "documents",
    title: "Documents & queues",
    description: "Document collection and authorised queues",
    icon: "document-text-outline",
    fee: 150,
  },
  {
    id: "delivery",
    title: "Deliver or return",
    description: "Drop off an item or handle a return",
    icon: "bicycle-outline",
    fee: 150,
  },
  {
    id: "business",
    title: "Business errands",
    description: "Stock collection and business tasks",
    icon: "briefcase-outline",
    fee: 200,
  },
  {
    id: "other",
    title: "Something else",
    description: "Tell us what you need done",
    icon: "ellipsis-horizontal-circle-outline",
    fee: 150,
  },
];

const URGENCY_OPTIONS: {
  id: Urgency;
  title: string;
  extraFee: number;
}[] = [
  { id: "standard", title: "Flexible", extraFee: 0 },
  { id: "today", title: "Today", extraFee: 50 },
  { id: "urgent", title: "Urgent", extraFee: 100 },
];

const formatKES = (amount: number) => `KSh ${amount.toLocaleString("en-KE")}`;

export default function ErrandsScreen() {
  const nav = useNav();
  const { errands, addErrand } = useAppData();

  const [showForm, setShowForm] = useState(false);
  const [typeId, setTypeId] = useState<ErrandTypeId | null>(null);
  const [pickup, setPickup] = useState("");
  const [destination, setDestination] = useState("");
  const [preferredTime, setPreferredTime] = useState("");
  const [urgency, setUrgency] = useState<Urgency>("standard");
  const [purchaseRequired, setPurchaseRequired] = useState(false);
  const [purchaseBudget, setPurchaseBudget] = useState("");
  const [details, setDetails] = useState("");

  const selectedCategory = CATEGORIES.find(
    (category) => category.id === typeId,
  );

  const selectedUrgency = URGENCY_OPTIONS.find(
    (option) => option.id === urgency,
  );

  const serviceFee = useMemo(() => {
    if (!selectedCategory) return 0;

    return selectedCategory.fee + (selectedUrgency?.extraFee ?? 0);
  }, [selectedCategory, selectedUrgency]);

  const resetForm = () => {
    setTypeId(null);
    setPickup("");
    setDestination("");
    setPreferredTime("");
    setUrgency("standard");
    setPurchaseRequired(false);
    setPurchaseBudget("");
    setDetails("");
    setShowForm(false);
  };

  const handleSubmit = () => {
    if (!typeId || !selectedCategory) {
      Alert.alert("Choose an errand", "Select the type of errand first.");
      return;
    }

    if (details.trim().length < 5) {
      Alert.alert("More details needed", "Please describe what you need done.");
      return;
    }

    if (typeId !== "other" && !pickup.trim()) {
      Alert.alert(
        "Pickup location required",
        "Enter the location where the errand starts.",
      );
      return;
    }

    if (
      (typeId === "delivery" || typeId === "business") &&
      !destination.trim()
    ) {
      Alert.alert(
        "Destination required",
        "Enter the destination for this errand.",
      );
      return;
    }

    if (purchaseRequired) {
      const budget = Number(purchaseBudget);

      if (!purchaseBudget.trim() || !Number.isFinite(budget) || budget <= 0) {
        Alert.alert(
          "Enter a purchase budget",
          "Add the amount needed for the item purchase.",
        );
        return;
      }
    }

    const structuredDetails = [
      `Service fee: ${serviceFee}`,
      "Payment status: PENDING",
      `Urgency: ${urgency}`,
      `Pickup: ${pickup.trim() || "To be confirmed"}`,
      `Destination: ${destination.trim() || "Not applicable"}`,
      `Preferred time: ${preferredTime.trim() || "Flexible"}`,
      `Purchase required: ${purchaseRequired ? "Yes" : "No"}`,
      purchaseRequired ? `Purchase budget: KSh ${purchaseBudget}` : "",
      `Instructions: ${details.trim()}`,
    ]
      .filter(Boolean)
      .join("\n");

    Alert.alert(
      "Continue to payment",
      `Your service fee is ${formatKES(serviceFee)}.\n\nPurchase and transport costs, if needed, may be charged separately. Continue to the payment step?`,
      [
        { text: "Review", style: "cancel" },
        {
          text: "Continue",
          onPress: () => {
            // IMPORTANT:
            // This records a request with payment pending.
            // It does NOT charge the customer.
            // Connect a backend payment gateway before treating an errand as paid.
            addErrand(typeId, structuredDetails);
            resetForm();

            Alert.alert(
              "Request saved",
              "Your errand request has been saved. Payment is not yet confirmed, so the errand must not start until the payment gateway confirms payment.",
            );
          },
        },
      ],
    );
  };

  const getCategory = (id: string) =>
    CATEGORIES.find((category) => category.id === id);

  return (
    <Screen scroll>
      <BackHeader title="Gekel Errands" />

      <View className="px-5 pb-8">
        <View className="mb-5 rounded-2xl bg-orange-50 p-5">
          <View className="mb-2 flex-row items-center">
            <Ionicons name="flash-outline" size={22} color="#EA580C" />
            <Text className="ml-2 text-lg font-bold text-gray-900">
              Your errands, handled.
            </Text>
          </View>
          <Text className="text-sm leading-5 text-gray-600">
            Tell us what you need. See your service fee upfront before
            continuing to payment.
          </Text>

          <View className="mt-4 flex-row items-center">
            <Ionicons
              name="shield-checkmark-outline"
              size={17}
              color="#15803D"
            />
            <Text className="ml-2 text-xs text-gray-600">
              Clear pricing before work begins
            </Text>
          </View>
        </View>

        {!showForm ? (
          <Button title="Request an Errand" onPress={() => setShowForm(true)} />
        ) : (
          <View className="rounded-2xl border border-gray-200 p-4">
            <Text className="mb-1 text-xl font-bold text-gray-900">
              What do you need?
            </Text>
            <Text className="mb-4 text-sm text-gray-500">
              Choose a category to see its service fee.
            </Text>

            <View className="mb-5 flex-row flex-wrap gap-2">
              {CATEGORIES.map((category) => {
                const selected = typeId === category.id;

                return (
                  <Pressable
                    key={category.id}
                    onPress={() => setTypeId(category.id)}
                    className={`w-[48%] rounded-xl border p-3 ${
                      selected
                        ? "border-orange-500 bg-orange-50"
                        : "border-gray-200 bg-white"
                    }`}
                  >
                    <Ionicons
                      name={category.icon}
                      size={23}
                      color={selected ? "#EA580C" : "#6B7280"}
                    />
                    <Text className="mt-2 text-sm font-semibold text-gray-900">
                      {category.title}
                    </Text>
                    <Text className="mt-1 text-xs text-gray-500">
                      {category.description}
                    </Text>
                    <Text className="mt-2 text-sm font-bold text-orange-600">
                      From {formatKES(category.fee)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text className="mb-2 font-semibold text-gray-900">
              Pickup location
            </Text>
            <TextInput
              value={pickup}
              onChangeText={setPickup}
              placeholder="Where should we start?"
              className="mb-4 rounded-xl border border-gray-200 px-4 py-3 text-gray-900"
              placeholderTextColor="#9CA3AF"
            />

            <Text className="mb-2 font-semibold text-gray-900">
              Destination (if applicable)
            </Text>
            <TextInput
              value={destination}
              onChangeText={setDestination}
              placeholder="Where should it go?"
              className="mb-4 rounded-xl border border-gray-200 px-4 py-3 text-gray-900"
              placeholderTextColor="#9CA3AF"
            />

            <Text className="mb-2 font-semibold text-gray-900">
              Preferred time
            </Text>
            <TextInput
              value={preferredTime}
              onChangeText={setPreferredTime}
              placeholder="e.g. After 2 PM"
              className="mb-4 rounded-xl border border-gray-200 px-4 py-3 text-gray-900"
              placeholderTextColor="#9CA3AF"
            />

            <Text className="mb-2 font-semibold text-gray-900">How soon?</Text>
            <View className="mb-4 flex-row flex-wrap gap-2">
              {URGENCY_OPTIONS.map((option) => {
                const selected = urgency === option.id;

                return (
                  <Pressable
                    key={option.id}
                    onPress={() => setUrgency(option.id)}
                    className={`rounded-xl border px-3 py-3 ${
                      selected
                        ? "border-orange-500 bg-orange-50"
                        : "border-gray-200 bg-white"
                    }`}
                  >
                    <Text
                      className={`text-sm font-semibold ${
                        selected ? "text-orange-700" : "text-gray-700"
                      }`}
                    >
                      {option.title}
                      {option.extraFee > 0
                        ? ` (+${formatKES(option.extraFee)})`
                        : ""}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Pressable
              onPress={() => setPurchaseRequired((current) => !current)}
              className="mb-3 flex-row items-center"
              accessibilityRole="checkbox"
              accessibilityState={{ checked: purchaseRequired }}
            >
              <Ionicons
                name={purchaseRequired ? "checkbox" : "square-outline"}
                size={23}
                color={purchaseRequired ? "#EA580C" : "#6B7280"}
              />
              <Text className="ml-2 flex-1 text-sm text-gray-800">
                The runner needs to purchase something
              </Text>
            </Pressable>

            {purchaseRequired && (
              <>
                <Text className="mb-2 font-semibold text-gray-900">
                  Purchase budget (KSh)
                </Text>
                <TextInput
                  value={purchaseBudget}
                  onChangeText={setPurchaseBudget}
                  placeholder="e.g. 1000"
                  keyboardType="numeric"
                  className="mb-4 rounded-xl border border-gray-200 px-4 py-3 text-gray-900"
                  placeholderTextColor="#9CA3AF"
                />
              </>
            )}

            <Text className="mb-2 font-semibold text-gray-900">
              Instructions
            </Text>
            <TextInput
              value={details}
              onChangeText={setDetails}
              placeholder="Describe the errand and any important details..."
              multiline
              textAlignVertical="top"
              className="mb-4 min-h-[110px] rounded-xl border border-gray-200 px-4 py-3 text-gray-900"
              placeholderTextColor="#9CA3AF"
            />

            <View className="mb-4 rounded-2xl bg-gray-50 p-4">
              <Text className="mb-3 text-base font-bold text-gray-900">
                Your fee summary
              </Text>

              <View className="mb-2 flex-row justify-between">
                <Text className="flex-1 text-sm text-gray-600">
                  {selectedCategory?.title ?? "Select an errand"}
                </Text>
                <Text className="font-medium text-gray-900">
                  {formatKES(selectedCategory?.fee ?? 0)}
                </Text>
              </View>

              {urgency !== "standard" && (
                <View className="mb-2 flex-row justify-between">
                  <Text className="text-sm text-gray-600">
                    {selectedUrgency?.title} priority
                  </Text>
                  <Text className="font-medium text-gray-900">
                    {formatKES(selectedUrgency?.extraFee ?? 0)}
                  </Text>
                </View>
              )}

              <View className="my-2 h-px bg-gray-200" />

              <View className="flex-row items-center justify-between">
                <Text className="font-bold text-gray-900">
                  Service fee due upfront
                </Text>
                <Text className="text-xl font-bold text-orange-600">
                  {formatKES(serviceFee)}
                </Text>
              </View>

              <Text className="mt-2 text-xs leading-5 text-gray-500">
                Purchase budget, transport and third-party charges are not
                included. Any additional charges must be disclosed and approved
                before the errand proceeds.
              </Text>
            </View>

            <Button
              title={`Continue to Payment · ${formatKES(serviceFee)}`}
              onPress={handleSubmit}
            />

            <Pressable onPress={resetForm} className="mt-3 items-center py-3">
              <Text className="font-semibold text-gray-500">Cancel</Text>
            </Pressable>
          </View>
        )}

        <View className="mt-7">
          <Text className="mb-3 text-lg font-bold text-gray-900">
            Your errands
          </Text>

          {!errands || errands.length === 0 ? (
            <EmptyState
              icon="receipt-outline"
              title="No errands yet"
              body="Your requested errands will appear here. Choose a task above and let GEKEL handle it."
              cta="Request an Errand"
              onCta={() => setShowForm(true)}
            />
          ) : (
            errands.map((item: any) => {
              const category = getCategory(item.typeId);
              const stage =
                ERRAND_STAGES[item.stage] ?? String(item.stage ?? "Pending");

              return (
                <Pressable
                  key={item.id}
                  onPress={() => nav.navigate("ErrandDetail", { id: item.id })}
                  className="mb-3 rounded-2xl border border-gray-200 p-4"
                >
                  <View className="flex-row items-start">
                    <View className="mr-3 rounded-xl bg-orange-50 p-3">
                      <Ionicons
                        name={category?.icon ?? "receipt-outline"}
                        size={22}
                        color="#EA580C"
                      />
                    </View>

                    <View className="flex-1">
                      <Text className="font-bold text-gray-900">
                        {category?.title ?? "Errand request"}
                      </Text>
                      <Text className="mt-1 text-xs text-gray-500">
                        {item.createdAt ? timeAgo(item.createdAt) : "Recently"}
                      </Text>
                      <Text className="mt-2 text-sm text-gray-600">
                        {stage}
                      </Text>
                    </View>

                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color="#9CA3AF"
                    />
                  </View>
                </Pressable>
              );
            })
          )}
        </View>
      </View>
    </Screen>
  );
}
