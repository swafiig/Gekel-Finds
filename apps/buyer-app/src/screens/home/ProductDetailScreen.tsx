import React, { useEffect, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Share,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { RouteProp, useRoute } from "@react-navigation/native";
import ProductImage from "../../components/ProductImage";
import Button from "../../components/Button";
import OnlineStatus from "../../components/OnlineStatus";
import { FlashBanner } from "../../components/FlashTimer";
import {
  modeFor,
  unitPriceFor,
  useAppData,
} from "../../context/AppDataContext";
import {
  PRODUCTS,
  SELLER_LABEL,
  SUPPLIERS,
  categoryName,
  formatKsh,
} from "../../data/mock";
import { useNav } from "../../hooks/useNav";
import type { RootStackParamList } from "../../types/navigation";
import { useIconColor } from "../../hooks/useIconColor";

export default function ProductDetailScreen() {
  const nav = useNav();
  const { id } =
    useRoute<RouteProp<RootStackParamList, "ProductDetail">>().params;
  const {
    favorites,
    toggleFavorite,
    openSupplierChat,
    addToCart,
    cart,
    following,
    toggleFollow,
  } = useAppData();
  const product = PRODUCTS.find((p) => p.id === id)!;
  const supplier = SUPPLIERS.find((s) => s.id === product.supplierId)!;
  const fav = favorites.includes(id);
  const followed = following.includes(supplier.id);

  const [qty, setQty] = useState(1);
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [quoteQty, setQuoteQty] = useState("1");
  const [quoteBudget, setQuoteBudget] = useState("");

  const ic = useIconColor();
  const w = product.wholesale;
  const unit = unitPriceFor(id, qty);
  const items = unit * qty;
  const isWholesale = modeFor(id, qty) === "wholesale";
  const chamaNeed = w?.minQty ?? 0;

  // Bulk detection
  const moq = w?.minQty ?? Infinity;
  const isBulk = qty >= moq;
  const isClearlyBulk = qty >= moq * 2 || items >= 50000;

  // Auto-open quote modal when buyer clearly wants bulk
  useEffect(() => {
    if (isClearlyBulk) setQuoteOpen(true);
  }, [isClearlyBulk]);

  // Prefill the modal whenever it opens
  useEffect(() => {
    if (quoteOpen) {
      setQuoteQty(String(qty));
      setQuoteBudget(String(qty * product.price));
    }
  }, [quoteOpen, qty, product.price]);

  const inviteFriends = () =>
    Share.share({
      message: `Join my Chama Buy on GEKEL: ${product.name} at ${formatKsh(
        w!.unitPrice,
      )} each when we reach ${chamaNeed}. Tap to join.`,
    });

  const submitQuote = () => {
    const q = parseInt(quoteQty, 10) || 0;
    const b = parseInt(quoteBudget, 10) || 0;
    if (!q) return;
    setQuoteOpen(false);
    const chatId = openSupplierChat(supplier.id);
    nav.navigate("ChatRoom", {
      id: chatId,
      prefillQuote: { productId: id, qty: q, budget: b },
    });
  };

  return (
    <SafeAreaView
      className="flex-1 bg-white dark:bg-surface"
      edges={["top", "bottom"]}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        <View>
          <ProductImage product={product} height={290} artSize={190} />
          <Pressable
            onPress={() => nav.goBack()}
            accessibilityLabel="Go back"
            className="absolute left-4 top-3 h-10 w-10 items-center justify-center rounded-full bg-white-90"
          >
            <Ionicons name="arrow-back" size={20} color={ic.primary} />
          </Pressable>
          <Pressable
            onPress={() => toggleFavorite(id)}
            accessibilityLabel="Save"
            className="absolute right-16 top-3 h-10 w-10 items-center justify-center rounded-full bg-white-90"
          >
            <Ionicons
              name={fav ? "heart" : "heart-outline"}
              size={20}
              color={fav ? "#FA3504" : "#1C1917"}
            />
          </Pressable>
          <Pressable
            onPress={() => nav.navigate("Cart")}
            accessibilityLabel="Cart"
            className="absolute right-4 top-3 h-10 w-10 items-center justify-center rounded-full bg-white-90"
          >
            <Ionicons name="cart-outline" size={20} color={ic.primary} />
            {cart.length > 0 && (
              <View className="absolute -right-1 -top-1 h-4 min-w-[16px] items-center justify-center rounded-full bg-brand-500 px-1">
                <Text className="text-[10px] font-bold text-white">
                  {cart.length}
                </Text>
              </View>
            )}
          </Pressable>
        </View>

        <View className="px-5 pt-5">
          {product.flashEndsAt ? (
            <FlashBanner endsAt={product.flashEndsAt} />
          ) : null}
          <Text className="text-xs text-ink-mute dark:text-sink-mute">
            {categoryName(product.category)}
          </Text>
          <Text className="mt-1 text-2xl font-extrabold text-ink dark:text-sink">
            {product.name}
          </Text>
          <View className="mt-1 flex-row items-end">
            <Text className="text-2xl font-extrabold text-brand-600">
              {formatKsh(product.price)}
            </Text>
            {product.oldPrice ? (
              <Text className="mb-0.5 ml-2 text-base text-ink-mute dark:text-sink-mute line-through">
                {formatKsh(product.oldPrice)}
              </Text>
            ) : null}
          </View>
          <Text className="mt-3 text-base leading-6 text-ink-soft dark:text-sink-soft">
            {product.description}
          </Text>

          {product.compare && (
            <View className="mt-5 rounded-2xl border border-line dark:border-surface-line bg-cream dark:bg-surface-soft p-4">
              <View className="flex-row items-center justify-between">
                <Text className="text-sm font-extrabold text-ink dark:text-sink">
                  Compare prices
                </Text>
                <Text className="text-xs font-bold text-success">
                  {Math.round(
                    ((product.compare.retailShop - unit) /
                      product.compare.retailShop) *
                      100,
                  )}
                  % below a retail shop
                </Text>
              </View>
              {(
                [
                  ["GEKEL price", unit, "bg-brand-500"],
                  [
                    "Typical online marketplaces",
                    product.compare.onlineAvg,
                    "bg-stone-400",
                  ],
                  [
                    "Typical retail shop",
                    product.compare.retailShop,
                    "bg-stone-300",
                  ],
                ] as const
              ).map(([label, value, bar]) => (
                <View key={label} className="mt-3">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-xs text-ink-soft dark:text-sink-soft">
                      {label}
                    </Text>
                    <Text className="text-xs font-bold text-ink dark:text-sink">
                      {formatKsh(value)}
                    </Text>
                  </View>
                  <View className="mt-1 h-2 overflow-hidden rounded-full bg-line dark:bg-surface-line">
                    <View
                      style={{
                        width: `${Math.min(
                          100,
                          (value / product.compare!.retailShop) * 100,
                        )}%`,
                      }}
                      className={`h-full rounded-full ${bar}`}
                    />
                  </View>
                </View>
              ))}
              <Text className="mt-3 text-[11px] leading-4 text-ink-mute dark:text-sink-mute">
                Rough averages from what buyers typically pay around Nairobi —
                not any one named shop or app.
              </Text>
            </View>
          )}

          {/* supplier */}
          <View className="mt-4 flex-row items-center rounded-2xl border border-line dark:border-surface-line p-3">
            <Pressable
              onPress={() =>
                nav.navigate("SupplierProfile", { id: supplier.id })
              }
              className="flex-1 flex-row items-center"
            >
              <View className="h-11 w-11 items-center justify-center rounded-full bg-brand-50">
                <Ionicons name="storefront" size={20} color="#FA3504" />
              </View>
              <View className="ml-3 flex-1">
                <View className="flex-row items-center">
                  <Text
                    numberOfLines={1}
                    className="shrink text-base font-bold text-ink dark:text-sink"
                  >
                    {supplier.name}
                  </Text>
                  {supplier.verified && (
                    <Ionicons
                      name="shield-checkmark"
                      size={14}
                      color="#15803D"
                      style={{ marginLeft: 6 }}
                    />
                  )}
                </View>
                <Text className="text-sm text-ink-soft dark:text-sink-soft">
                  ★ {supplier.rating} ({supplier.reviewCount}) ·{" "}
                  {SELLER_LABEL[supplier.type]}
                </Text>
                <View className="mt-0.5">
                  <OnlineStatus
                    online={supplier.online}
                    lastSeen={supplier.lastSeen}
                  />
                </View>
              </View>
            </Pressable>
            <Pressable
              hitSlop={8}
              onPress={() => toggleFollow(supplier.id)}
              accessibilityLabel={
                followed ? "Unfollow supplier" : "Follow supplier"
              }
              className={`mr-2 h-9 flex-row items-center rounded-full px-3 ${
                followed ? "bg-cream dark:bg-surface-soft" : "bg-brand-50"
              }`}
            >
              <Ionicons
                name={followed ? "checkmark" : "add"}
                size={14}
                color="#FA3504"
              />
              <Text className="ml-1 text-xs font-bold text-brand-600">
                {followed ? "Following" : "Follow"}
              </Text>
            </Pressable>
            <Pressable
              hitSlop={10}
              onPress={() =>
                nav.navigate("ChatRoom", { id: openSupplierChat(supplier.id) })
              }
              accessibilityLabel="Message supplier"
            >
              <Ionicons
                name="chatbubble-ellipses-outline"
                size={22}
                color="#FA3504"
              />
            </Pressable>
          </View>

          {product.warranty && (
            <View className="mt-3 flex-row items-start rounded-2xl bg-green-50 p-3">
              <Ionicons
                name="ribbon-outline"
                size={18}
                color="#15803D"
                style={{ marginTop: 1 }}
              />
              <Text className="ml-3 flex-1 text-sm leading-5 text-ink">
                <Text className="font-bold">
                  {product.warranty.days}-day warranty.{" "}
                </Text>
                {product.warranty.note}
              </Text>
            </View>
          )}

          {/* quantity + tiers */}
          <View className="mt-5 flex-row items-center justify-between">
            <Text className="text-base font-semibold text-ink dark:text-sink">
              Quantity
            </Text>
            <View className="flex-row items-center">
              <Pressable
                disabled={qty <= 1}
                onPress={() => setQty(qty - 1)}
                accessibilityLabel="Decrease"
                className={`h-10 w-10 items-center justify-center rounded-full border border-line dark:border-surface-line ${
                  qty <= 1 ? "opacity-40" : ""
                }`}
              >
                <Ionicons name="remove" size={18} color={ic.primary} />
              </Pressable>
              <Text className="w-12 text-center text-lg font-bold text-ink dark:text-sink">
                {qty}
              </Text>
              <Pressable
                onPress={() => setQty(qty + 1)}
                accessibilityLabel="Increase"
                className="h-10 w-10 items-center justify-center rounded-full bg-brand-500"
              >
                <Ionicons name="add" size={18} color="#fff" />
              </Pressable>
            </View>
          </View>

          {w && (
            <Pressable
              onPress={() => setQty(Math.max(qty, w.minQty))}
              className={`mt-3 flex-row items-center rounded-2xl p-3 ${
                isWholesale ? "bg-green-50" : "bg-brand-50"
              }`}
            >
              <Ionicons
                name="layers"
                size={18}
                color={isWholesale ? "#15803D" : "#FA3504"}
              />
              <Text className="ml-2 flex-1 text-sm text-ink">
                {isWholesale
                  ? `Wholesale price applied: ${formatKsh(
                      w.unitPrice,
                    )} each. You save ${formatKsh(
                      (product.price - w.unitPrice) * qty,
                    )}.`
                  : `Buy ${w.minQty}+ for ${formatKsh(
                      w.unitPrice,
                    )} each. Tap to jump to ${w.minQty}.`}
              </Text>
            </Pressable>
          )}

          {/* Ask quote prompt for bulk */}
          {w && qty >= w.minQty && (
            <Pressable
              onPress={() => setQuoteOpen(true)}
              className="mt-3 flex-row items-center rounded-2xl border border-brand-300 bg-brand-50 p-3"
            >
              <Ionicons name="chatbubbles-outline" size={18} color="#FA3504" />
              <Text className="ml-2 flex-1 text-sm font-bold text-brand-700">
                Want a better price for {qty} pieces? Ask for a quote
              </Text>
              <Ionicons name="chevron-forward" size={16} color="#FA3504" />
            </Pressable>
          )}

          {/* Chama Buy */}
          {w && (
            <View className="mt-4 rounded-2xl border border-line dark:border-surface-line bg-white dark:bg-surface p-4">
              <View className="flex-row items-center">
                <Ionicons name="people" size={18} color="#FA3504" />
                <Text className="ml-2 text-base font-extrabold text-ink dark:text-sink">
                  Chama Buy
                </Text>
              </View>
              <Text className="mt-1 text-sm leading-5 text-ink-soft dark:text-sink-soft">
                Not enough for wholesale alone? Create a group with people from
                your contacts — each person picks their own quantity, and one
                bundle order reaches {chamaNeed} pieces so everyone pays{" "}
                {formatKsh(w.unitPrice)} each.
              </Text>
              <View className="mt-3 flex-row gap-3">
                <Button
                  title="Start a Chama Buy"
                  icon="people"
                  className="h-11 flex-1"
                  onPress={() => nav.navigate("ChamaCreate", { productId: id })}
                />
                <Button
                  title="Share"
                  icon="share-social-outline"
                  variant="outline"
                  className="h-11 w-24"
                  onPress={inviteFriends}
                />
              </View>
            </View>
          )}

          <View className="mt-5 gap-3">
            {[
              ["shield-checkmark", "Inspected and sealed with serialized tape"],
              ["camera", "Photo proof from the stall and from the rider"],
              [
                "flash",
                product.sameDay
                  ? "Same-day delivery in Nairobi"
                  : "Delivered within 3 days",
              ],
              [
                "return-up-back",
                "3-day return window — ask the supplier before a pickup is booked",
              ],
            ].map(([i, t]) => (
              <View key={t} className="flex-row items-center">
                <Ionicons name={i as any} size={18} color="#FA3504" />
                <Text className="ml-3 flex-1 text-sm text-ink dark:text-sink">
                  {t}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Bottom bar */}
      <View className="border-t border-line dark:border-surface-line bg-white dark:bg-surface px-5 pt-3">
        {w && qty >= w.minQty && (
          <Pressable
            onPress={() => setQuoteOpen(true)}
            className="mb-2 flex-row items-center justify-center rounded-2xl border border-brand-300 bg-brand-50 py-2.5"
          >
            <Ionicons name="chatbubbles-outline" size={16} color="#FA3504" />
            <Text className="ml-2 text-sm font-bold text-brand-700">
              Ask for a bulk quote
            </Text>
          </Pressable>
        )}
        <View className="flex-row gap-3">
          <Button
            title="Add to cart"
            icon="cart-outline"
            variant="outline"
            className="h-14 flex-1"
            onPress={() => {
              addToCart(id, qty);
              Alert.alert("Added to cart", `${qty} × ${product.name}`, [
                { text: "Keep browsing", style: "cancel" },
                { text: "View cart", onPress: () => nav.navigate("Cart") },
              ]);
            }}
          />
          <Button
            title={`Request · ${formatKsh(items)}`}
            className="h-14 flex-[1.4]"
            onPress={() => {
              if (isClearlyBulk) setQuoteOpen(true);
              else
                nav.navigate("Checkout", { lines: [{ productId: id, qty }] });
            }}
          />
        </View>
      </View>

      {/* Quote modal */}
      <Modal
        visible={quoteOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setQuoteOpen(false)}
      >
        <View className="flex-1 justify-end bg-black-40">
          <Pressable className="flex-1" onPress={() => setQuoteOpen(false)} />
          <View className="rounded-t-[28px] bg-white dark:bg-surface px-5 pb-8 pt-3">
            <View className="mb-3 h-1.5 w-12 self-center rounded-full bg-line" />
            <Text className="text-xl font-extrabold text-ink dark:text-sink">
              Ask for a quote
            </Text>
            <Text className="mt-1 text-sm leading-5 text-ink-soft dark:text-sink-soft">
              Tell the shop how many {product.name} you need and your target
              total. They may give you a better rate for bulk — the shop replies
              in chat and you can accept or walk away.
            </Text>

            <Text className="mb-2 mt-4 text-sm font-bold text-ink dark:text-sink">
              Quantity
            </Text>
            <TextInput
              value={quoteQty}
              onChangeText={setQuoteQty}
              keyboardType="number-pad"
              placeholder={`e.g. ${w?.minQty ?? 10}`}
              placeholderTextColor={ic.faint}
              className="h-12 rounded-2xl border border-line dark:border-surface-line bg-cream dark:bg-surface-soft px-4 text-base text-ink dark:text-sink"
            />

            <Text className="mb-2 mt-4 text-sm font-bold text-ink dark:text-sink">
              Target total (optional)
            </Text>
            <TextInput
              value={quoteBudget}
              onChangeText={setQuoteBudget}
              keyboardType="number-pad"
              placeholder="e.g. 7500"
              placeholderTextColor={ic.faint}
              className="h-12 rounded-2xl border border-line dark:border-surface-line bg-cream dark:bg-surface-soft px-4 text-base text-ink dark:text-sink"
            />
            <Text className="mt-1 text-xs text-ink-mute dark:text-sink-mute">
              At retail:{" "}
              {formatKsh((parseInt(quoteQty, 10) || 0) * product.price)}.
              {w ? ` Wholesale rate: ${formatKsh(w.unitPrice)} each.` : ""}
            </Text>

            <View className="mt-4 flex-row gap-3">
              <Button
                title="Cancel"
                variant="ghost"
                className="h-12 flex-1"
                onPress={() => setQuoteOpen(false)}
              />
              <Button
                title="Send to shop"
                className="h-12 flex-[1.4]"
                disabled={!parseInt(quoteQty, 10)}
                onPress={submitQuote}
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
