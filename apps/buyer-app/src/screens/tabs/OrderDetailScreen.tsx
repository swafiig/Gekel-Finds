import React, { useState } from "react";
import { Alert, Image, Linking, Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { RouteProp, useRoute } from "@react-navigation/native";
import Screen from "../../components/Screen";
import BackHeader from "../../components/BackHeader";
import Button from "../../components/Button";
import Timeline from "../../components/Timeline";
import EmptyState from "../../components/EmptyState";
import Stars from "../../components/Stars";
import { ProductArt } from "../../components/Illustrations";
import {
  Order,
  ReturnStatus,
  TrackEvent,
  orderStages,
  useAppData,
} from "../../context/AppDataContext";
import {
  DELIVERED,
  PRODUCTS,
  Product,
  SUPPLIERS,
  formatKsh,
  timeAgo,
} from "../../data/mock";
import { useNav } from "../../hooks/useNav";
import type { RootStackParamList } from "../../types/navigation";

const PHOTO_LABEL = {
  sealed: "Sealed at the stall",
  pickup: "Picked up by your rider",
  delivery: "Delivered at the door",
  receipt: "Courier receipt",
};
const p2 = (n: number) => String(n).padStart(2, "0");
const stamp = (t: number) => {
  const d = new Date(t);
  return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())} ${p2(d.getHours())}:${p2(d.getMinutes())}:${p2(d.getSeconds())}`;
};

/** Rider photo. Real upload when `imageUri` exists, illustrated placeholder until your API supplies it. */
function PhotoTile({
  event,
  product,
  order,
}: {
  event: TrackEvent;
  product: Product;
  order: Order;
}) {
  if (event.imageUri)
    return (
      <Image
        source={{ uri: event.imageUri }}
        className="mt-2 h-40 w-full rounded-xl"
        resizeMode="cover"
      />
    );
  if (!event.photo) return null;
  if (event.photo === "receipt") {
    return (
      <View className="mt-2 overflow-hidden rounded-xl bg-stone-100 p-4">
        <View className="rounded-lg bg-white p-3 ">
          <Text className="text-center text-xs font-extrabold tracking-widest text-ink">
            {(order.courier?.name ?? "COURIER").toUpperCase()}
          </Text>
          <View className="my-2 h-px bg-line" />
          <Text className="text-xs text-ink-soft">Waybill</Text>
          <Text className="text-base font-extrabold tracking-widest text-ink">
            {order.courier?.waybill}
          </Text>
          <Text className="mt-2 text-xs text-ink-soft">
            To: {order.address}
          </Text>
        </View>
        <View className="mt-2 flex-row items-center">
          <Ionicons name="camera" size={12} color="#57534E" />
          <Text className="ml-1.5 text-xs font-semibold text-ink-soft">
            Rider photo · {PHOTO_LABEL.receipt}
          </Text>
        </View>
      </View>
    );
  }
  return (
    <View
      style={{ backgroundColor: product.tint }}
      className="mt-2 h-36 overflow-hidden rounded-xl"
    >
      <View className="flex-1 items-center justify-center">
        <ProductArt kind={product.kind} size={84} />
      </View>
      <View className="flex-row items-center bg-black-55 px-3 py-1.5">
        <Ionicons name="camera" size={12} color="#fff" />
        <Text className="ml-1.5 text-xs font-semibold text-white">
          Rider photo · {PHOTO_LABEL[event.photo]}
        </Text>
      </View>
    </View>
  );
}

const Badge = ({ text, tone }: { text: string; tone: "green" | "amber" }) => (
  <View
    className={`rounded-md px-2 py-0.5 ${tone === "green" ? "bg-green-100" : "bg-amber-50"}`}
  >
    <Text
      className={`text-xs font-bold ${tone === "green" ? "text-success" : "text-amber-700"}`}
    >
      {text}
    </Text>
  </View>
);
const H = ({ children }: { children: string }) => (
  <Text className="mb-3 mt-6 text-lg font-extrabold text-ink">{children}</Text>
);

export default function OrderDetailScreen() {
  const nav = useNav();
  const { id } =
    useRoute<RouteProp<RootStackParamList, "OrderDetail">>().params;
  const {
    orders,
    advanceOrder,
    advanceCourier,
    confirmReceived,
    rateOrder,
    respondReturn,
    bookReturnPickup,
  } = useAppData();
  const [sRate, setSRate] = useState(0);
  const [rRate, setRRate] = useState(0);
  const order = orders.find((o) => o.id === id);

  if (!order)
    return (
      <Screen>
        <BackHeader />
        <EmptyState
          icon="alert-circle-outline"
          title="Order not found"
          body="It may have been removed."
          cta="Go home"
          onCta={() => nav.navigate("Main")}
        />
      </Screen>
    );

  const first = PRODUCTS.find((x) => x.id === order.items[0].productId)!;
  const supplier = SUPPLIERS.find((s) => s.id === order.supplierId)!;
  const stages = orderStages(order);
  const courier = order.delivery.method === "courier";
  const delivered = order.stage === DELIVERED;
  const awaiting = order.stage === 0 && !order.cancelled;
  const total = order.price + order.deliveryFee + order.serviceFee;
  const how = courier
    ? `${order.delivery.courier} · ${order.delivery.dest === "door" ? "to your door" : "collect at office"}`
    : `${order.delivery.speed === "express" ? "Express · shop straight to you" : "Standard"} · ${order.delivery.dest === "pickup" ? `pickup at ${order.delivery.pickupPoint}` : "to your door"}`;

  return (
    <Screen scroll>
      <BackHeader title="Order" />

      <View
        className={`mt-4 rounded-2xl p-4 ${order.cancelled ? "bg-stone-200" : delivered ? "bg-green-50" : awaiting ? "bg-amber-50" : "bg-brand-500"}`}
      >
        <Text
          className={`text-sm ${order.cancelled ? "text-stone-600" : delivered ? "text-success" : awaiting ? "text-amber-700" : "text-white-80"}`}
        >
          {order.cancelled
            ? "Cancelled"
            : delivered
              ? "Delivered"
              : awaiting
                ? order.quote === "pending"
                  ? "Waiting for the shop"
                  : "Action needed"
                : courier
                  ? "Courier shipment"
                  : "Estimated arrival"}
        </Text>
        <Text
          className={`mt-1 text-3xl font-extrabold ${order.cancelled ? "text-stone-700" : delivered ? "text-success" : awaiting ? "text-ink" : "text-white"}`}
        >
          {order.cancelled
            ? "Order cancelled"
            : delivered
              ? "Enjoy your find!"
              : awaiting
                ? order.quote === "pending"
                  ? "Confirming stock"
                  : "Pay the shop"
                : courier
                  ? stages[order.stage]
                  : order.etaMinutes > 0
                    ? `${order.etaMinutes} min`
                    : "Getting ready"}
        </Text>
        <Text
          className={`mt-1 text-sm ${order.cancelled ? "text-stone-600" : delivered ? "text-ink-soft" : awaiting ? "text-amber-800" : "text-white-90"}`}
        >
          {awaiting && order.quote === "accepted"
            ? `Pay ${formatKsh(order.price)} by M-Pesa prompt or to Till ${supplier.till}.`
            : stages[order.stage]}
        </Text>
        {awaiting && (
          <Button
            title="Open chat"
            icon="chatbubbles-outline"
            className="mt-3 h-12"
            onPress={() => nav.navigate("ChatRoom", { id: order.chatId })}
          />
        )}
      </View>

      {order.bundleId && order.stops > 1 && (
        <Pressable
          onPress={() => nav.navigate("Bundle", { id: order.bundleId! })}
          className="mt-3 flex-row items-center rounded-2xl bg-brand-50 p-3.5"
        >
          <Ionicons name="git-merge" size={18} color="#F44236" />
          <Text className="ml-2 flex-1 text-sm font-semibold text-ink">
            Part of a combined order from {order.stops} shops
          </Text>
          <Ionicons name="chevron-forward" size={16} color="#F44236" />
        </Pressable>
      )}

      {/* items */}
      <View className="mt-4 rounded-2xl border border-line bg-white p-4">
        {order.items.map((i) => {
          const p = PRODUCTS.find((x) => x.id === i.productId)!;
          return (
            <View
              key={i.productId}
              className="flex-row items-center justify-between py-1"
            >
              <Text className="flex-1 pr-3 text-base font-bold text-ink">
                {i.qty} × {p.name}
              </Text>
              <Text className="text-sm font-semibold text-ink">
                {formatKsh(i.qty * i.unitPrice)}
              </Text>
            </View>
          );
        })}
        <Text className="mt-1 text-xs text-ink-mute">
          Order #{order.id.slice(0, 5).toUpperCase()}
        </Text>
      </View>

      <Pressable
        onPress={() => nav.navigate("SupplierProfile", { id: supplier.id })}
        className="mt-3 flex-row items-center rounded-2xl border border-line bg-white p-3 active:bg-cream"
      >
        <View className="h-11 w-11 items-center justify-center rounded-full bg-brand-50">
          <Ionicons name="storefront" size={20} color="#F44236" />
        </View>
        <View className="ml-3 flex-1">
          <Text className="text-base font-bold text-ink">{supplier.name}</Text>
          <Text className="text-sm text-ink-soft">
            ★ {supplier.rating} · {supplier.market}
          </Text>
        </View>
        <Pressable
          hitSlop={10}
          onPress={() => nav.navigate("ChatRoom", { id: order.chatId })}
        >
          <Ionicons
            name="chatbubble-ellipses-outline"
            size={22}
            color="#F44236"
          />
        </Pressable>
      </Pressable>

      <H>Payments</H>
      <View className="rounded-2xl border border-line dark:border-surface-line bg-white dark:bg-surface p-4">
        <View className="flex-row items-center justify-between">
          <View className="flex-1 pr-3">
            <Text className="text-sm font-semibold text-ink">
              Items · {formatKsh(order.price)}
            </Text>
            <Text className="text-xs text-ink-soft">
              To supplier Till {supplier.till}
            </Text>
          </View>
          <Badge
            text={order.stage >= 1 ? "Paid" : "Unpaid"}
            tone={order.stage >= 1 ? "green" : "amber"}
          />
        </View>
        {(order.deliveryFee > 0 || order.serviceFee > 0) && (
          <>
            <View className="my-3 h-px bg-line" />
            <View className="flex-row items-center justify-between">
              <View className="flex-1 pr-3">
                <Text className="text-sm font-semibold text-ink">
                  Delivery + service ·{" "}
                  {formatKsh(order.deliveryFee + order.serviceFee)}
                </Text>
                <Text className="text-xs text-ink-soft">
                  {order.delivery.pay === "now"
                    ? "Paid before dispatch"
                    : courier
                      ? "Pay the courier on collection"
                      : "Pay the rider on delivery"}
                </Text>
              </View>
              <Badge
                text={
                  order.deliveryPaid
                    ? "Paid"
                    : order.delivery.pay === "now"
                      ? "Unpaid"
                      : "Pay later"
                }
                tone={order.deliveryPaid ? "green" : "amber"}
              />
            </View>
          </>
        )}
        {order.paymentNote ? (
          <Text
            numberOfLines={2}
            className="mt-3 rounded-xl bg-cream p-3 text-xs text-ink-soft"
          >
            {order.paymentNote}
          </Text>
        ) : null}
      </View>

      <H>Delivery</H>
      <View className="rounded-2xl border border-line dark:border-surface-line bg-white dark:bg-surface p-4">
        <View className="flex-row items-center">
          <Ionicons
            name={
              courier
                ? "cube"
                : order.delivery.speed === "express"
                  ? "flash"
                  : "bicycle"
            }
            size={18}
            color="#F44236"
          />
          <Text className="ml-2 flex-1 text-sm font-bold text-ink">{how}</Text>
        </View>
        {order.dropship && (
          <View className="mt-3 flex-row items-center rounded-xl bg-brand-50 p-3">
            <Ionicons name="people" size={18} color="#F44236" />
            <Text className="ml-2 flex-1 text-sm text-ink">
              Shipping to your customer{" "}
              <Text className="font-bold">{order.dropship.name}</Text> ·{" "}
              {order.dropship.phone}
            </Text>
          </View>
        )}
        <View className="mt-3 flex-row items-start">
          <Ionicons
            name="location"
            size={18}
            color="#F44236"
            style={{ marginTop: 1 }}
          />
          <Text className="ml-2 flex-1 text-sm text-ink">{order.address}</Text>
        </View>
        {order.coords && (
          <Pressable
            onPress={() =>
              Linking.openURL(
                `https://www.google.com/maps/search/?api=1&query=${order.coords!.lat},${order.coords!.lng}`,
              )
            }
            className="mt-2"
          >
            <Text className="text-sm font-semibold text-brand-600">
              View pin on map
            </Text>
          </Pressable>
        )}
        {order.stage >= 3 && !courier && (
          <View className="mt-3 flex-row items-center">
            <Ionicons name="bicycle" size={18} color="#F44236" />
            <Text className="ml-2 flex-1 text-sm text-ink">
              {order.rider.name} · {order.rider.vehicle}
            </Text>
          </View>
        )}
      </View>

      {/* courier tracking */}
      {courier && order.courier && (
        <>
          <H>Courier tracking</H>
          <View className="rounded-2xl border border-line dark:border-surface-line bg-white dark:bg-surface p-4">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-xs text-ink-soft">
                  {order.courier.name}
                </Text>
                <Text
                  selectable
                  className="text-lg font-extrabold tracking-widest text-ink"
                >
                  {order.courier.waybill}
                </Text>
              </View>
              <Badge
                text={delivered ? "Delivered" : "In transit"}
                tone={delivered ? "green" : "amber"}
              />
            </View>
            <View className="mt-4">
              {[...order.courier.events].reverse().map((e, i, arr) => (
                <View key={e.id} className="flex-row">
                  <View className="items-center">
                    <View
                      className={`h-3 w-3 rounded-full ${i === 0 ? "bg-brand-500" : "bg-line"}`}
                    />
                    {i < arr.length - 1 && (
                      <View className="w-0.5 flex-1 bg-line" />
                    )}
                  </View>
                  <View className="ml-3 flex-1 pb-4">
                    <Text
                      className={`text-sm leading-5 ${i === 0 ? "font-semibold text-ink" : "text-ink-soft"}`}
                    >
                      {e.text}
                    </Text>
                    <Text className="mt-0.5 text-xs text-ink-mute">
                      {stamp(e.at)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </>
      )}

      <H>Updates & photos</H>
      {[...order.events].reverse().map((e) => (
        <View
          key={e.id}
          className="mb-3 rounded-2xl border border-line dark:border-surface-line bg-white dark:bg-surface p-4"
        >
          <View className="flex-row items-center justify-between">
            <Text className="flex-1 pr-3 text-base font-bold text-ink">
              {e.title}
            </Text>
            <Text className="text-xs text-ink-mute">{timeAgo(e.at)}</Text>
          </View>
          {e.note ? (
            <Text className="mt-0.5 text-sm text-ink-soft">{e.note}</Text>
          ) : null}
          <PhotoTile event={e} product={first} order={order} />
        </View>
      ))}

      <Text className="mb-4 mt-4 text-lg font-extrabold text-ink">
        Progress
      </Text>
      <Timeline
        steps={stages}
        current={order.stage}
        cancelled={order.cancelled}
      />

      {order.stage >= 2 && !order.cancelled && (
        <View className="mb-5 rounded-2xl border border-line bg-white p-4">
          <View className="flex-row items-center">
            <Ionicons name="shield-checkmark" size={20} color="#15803D" />
            <Text className="ml-2 text-base font-bold text-ink">
              Tamper seal verified
            </Text>
          </View>
          <Text className="mt-2 text-sm text-ink-soft">Seal serial number</Text>
          <Text
            selectable
            className="text-lg font-extrabold tracking-widest text-ink"
          >
            {order.sealNo}
          </Text>
          <Text className="mt-2 text-xs text-ink-mute">
            Check that the tape number matches before you accept the parcel.
          </Text>
        </View>
      )}

      {order.stage === 3 && !courier && !order.cancelled && (
        <View className="mb-5 rounded-2xl border border-line bg-white p-4">
          <View className="flex-row items-center">
            <View className="h-12 w-12 items-center justify-center rounded-full bg-brand-50">
              <Ionicons name="bicycle" size={24} color="#F44236" />
            </View>
            <View className="ml-3 flex-1">
              <Text className="text-base font-bold text-ink">
                {order.rider.name}
              </Text>
              <Text className="text-sm text-ink-soft">Your rider</Text>
            </View>
          </View>
          <View className="mt-3 flex-row gap-3">
            <Button
              title="Call"
              icon="call-outline"
              variant="outline"
              className="h-11 flex-1"
              onPress={() =>
                nav.navigate("Call", {
                  name: order.rider.name,
                  role: "Your rider",
                  limitSeconds: 180,
                })
              }
            />
            <Button
              title="Chat"
              icon="chatbubble-outline"
              variant="outline"
              className="h-11 flex-1"
              onPress={() => nav.navigate("ChatRoom", { id: order.chatId })}
            />
          </View>
        </View>
      )}

      {order.stage === 3 && !order.cancelled && (
        <View className="mb-5 rounded-2xl border border-green-200 bg-green-50 p-4">
          <Text className="text-base font-extrabold text-ink">
            Got your parcel?
          </Text>
          <Text className="mt-1 text-sm leading-5 text-ink-soft">
            Check the seal, then confirm. If you do not confirm, we mark it
            delivered 3 days after the{" "}
            {courier ? "courier signs for it" : "rider drops it"}.
          </Text>
          <Button
            title="I've received it"
            icon="checkmark-circle-outline"
            className="mt-3 h-12"
            onPress={() =>
              Alert.alert(
                "Confirm delivery",
                "Is everything in good order with the seal intact?",
                [
                  { text: "Not yet", style: "cancel" },
                  {
                    text: "Yes, confirm",
                    onPress: () => confirmReceived(order.id),
                  },
                ],
              )
            }
          />
        </View>
      )}

      <View className="rounded-2xl bg-cream p-4">
        <Line label="Items" value={formatKsh(order.price)} />
        <Line label="Delivery" value={formatKsh(order.deliveryFee)} />
        <Line label="GEKEL service fee" value={formatKsh(order.serviceFee)} />
        <View className="my-2 h-px bg-line" />
        <Line label="Total" value={formatKsh(total)} bold />
      </View>

      {delivered && (
        <View className="mt-5 rounded-2xl border border-line bg-white p-5">
          {order.rating ? (
            <Text className="text-center text-base font-bold text-ink">
              Thanks for rating! ★
            </Text>
          ) : (
            <>
              <Text className="text-base font-bold text-ink">
                Rate {supplier.name}
              </Text>
              <View className="my-2">
                <Stars value={sRate} size={30} onChange={setSRate} />
              </View>
              {!courier && (
                <>
                  <Text className="mt-2 text-base font-bold text-ink">
                    Rate {order.rider.name}
                  </Text>
                  <View className="my-2">
                    <Stars value={rRate} size={30} onChange={setRRate} />
                  </View>
                </>
              )}
              <Button
                title="Submit rating"
                className="mt-2 h-12"
                disabled={!sRate}
                onPress={() =>
                  rateOrder(order.id, { supplier: sRate, rider: rRate })
                }
              />
            </>
          )}
        </View>
      )}

      {delivered && (
        <View className="mt-5 rounded-2xl border border-line dark:border-surface-line bg-white dark:bg-surface p-5">
          {order.returnRequest ? (
            <ReturnStatusCard
              status={order.returnRequest.status}
              onRespond={(ok) => respondReturn(order.id, ok)}
              onBookPickup={(payer) => bookReturnPickup(order.id, payer)}
            />
          ) : (
            <Pressable
              onPress={() =>
                nav.navigate("ReturnRequest", { orderId: order.id })
              }
              className="flex-row items-center justify-center"
            >
              <Ionicons
                name="return-up-back-outline"
                size={16}
                color="#57534E"
              />
              <Text className="ml-2 text-sm font-bold text-ink-soft dark:text-sink-soft">
                Not happy with this order? Request a return
              </Text>
            </Pressable>
          )}
        </View>
      )}

      {__DEV__ && !delivered && !order.cancelled && (
        <View className="mt-3">
          <Button
            title="[Dev] Simulate next step"
            variant="ghost"
            onPress={() => advanceOrder(order.id)}
          />
          {courier && order.stage === 3 && (
            <Button
              title="[Dev] Simulate courier scan"
              variant="ghost"
              onPress={() => advanceCourier(order.id)}
            />
          )}
        </View>
      )}
    </Screen>
  );
}

function ReturnStatusCard({
  status,
  onRespond,
  onBookPickup,
}: {
  status: ReturnStatus;
  onRespond: (ok: boolean) => void;
  onBookPickup: (payer: "buyer" | "supplier") => void;
}) {
  const copy: Record<ReturnStatus, string> = {
    requested: "Your return request was sent to the supplier.",
    discussing:
      "Talk it through with the supplier in chat before booking a pickup.",
    approved: "The supplier agreed to the return. You can book a pickup now.",
    declined:
      "The supplier declined this return. You can still raise it with GEKEL support.",
    pickup_booked:
      "Pickup booked. A rider or your chosen courier will collect it.",
    refunded: "Refunded.",
  };
  return (
    <View>
      <View className="flex-row items-center">
        <Ionicons name="return-up-back" size={18} color="#F44236" />
        <Text className="ml-2 text-base font-bold text-ink dark:text-sink">
          Return request
        </Text>
      </View>
      <Text className="mt-1 text-sm leading-5 text-ink-soft dark:text-sink-soft">
        {copy[status]}
      </Text>
      {status === "approved" && (
        <View className="mt-3 flex-row gap-3">
          <Button
            title="I'll pay the return fee"
            variant="outline"
            className="h-11 flex-1"
            onPress={() => onBookPickup("buyer")}
          />
          <Button
            title="Supplier pays"
            variant="outline"
            className="h-11 flex-1"
            onPress={() => onBookPickup("supplier")}
          />
        </View>
      )}
      {__DEV__ && status === "discussing" && (
        <View className="mt-3 flex-row gap-3">
          <Button
            title="[Dev] Supplier agrees"
            variant="ghost"
            className="h-10 flex-1"
            onPress={() => onRespond(true)}
          />
          <Button
            title="[Dev] Supplier declines"
            variant="ghost"
            className="h-10 flex-1"
            onPress={() => onRespond(false)}
          />
        </View>
      )}
    </View>
  );
}

const Line = ({
  label,
  value,
  bold,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) => (
  <View className="flex-row items-center justify-between py-1">
    <Text
      className={`text-sm ${bold ? "font-bold text-ink" : "text-ink-soft"}`}
    >
      {label}
    </Text>
    <Text
      className={`${bold ? "text-base font-extrabold" : "text-sm font-semibold"} text-ink`}
    >
      {value}
    </Text>
  </View>
);
