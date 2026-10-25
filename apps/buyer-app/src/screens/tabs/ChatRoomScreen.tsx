import React, { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { SafeAreaView } from "react-native-safe-area-context";
import { RouteProp, useRoute } from "@react-navigation/native";
import Button from "../../components/Button";
import OnlineStatus from "../../components/OnlineStatus";
import { Message, Order, useAppData } from "../../context/AppDataContext";
import { useOffline } from "../../context/OfflineContext";
import { formatKsh } from "../../data/mock";
import { isKenyanPhone } from "../../utils/validation";
import { useNav } from "../../hooks/useNav";
import type { RootStackParamList } from "../../types/navigation";
import { useIconColor } from "../../hooks/useIconColor";
import { api } from "../../services/http";

const QUICK = [
  "Is it available?",
  "Last price?",
  "Send me a photo",
  "Delivery time?",
  "Wholesale price?",
];

async function pickImage(camera: boolean) {
  const perm = camera
    ? await ImagePicker.requestCameraPermissionsAsync()
    : await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) {
    Alert.alert(
      "Permission needed",
      `Allow ${camera ? "camera" : "photo"} access in Settings.`,
    );
    return undefined;
  }
  const res = camera
    ? await ImagePicker.launchCameraAsync({ quality: 0.7 })
    : await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 0.7,
      });
  return res.canceled ? undefined : res.assets[0].uri;
}

/** Shop asks "shall I pack it?". Buyer answers OK or No. */
function QuoteCard({ m, order }: { m: Message; order?: Order }) {
  const { respondQuote } = useAppData();
  const state = !order ? "accepted" : order.quote;
  return (
    <View className="mb-3 w-[86%] self-start overflow-hidden rounded-2xl border border-line bg-white">
      <View className="flex-row items-center bg-cream px-4 py-2">
        <Ionicons name="checkmark-done" size={16} color="#15803D" />
        <Text className="ml-2 text-xs font-bold tracking-widest text-success">
          AVAILABLE
        </Text>
      </View>
      <View className="p-4">
        <Text className="text-2xl font-extrabold text-ink">
          {formatKsh(m.amount ?? 0)}
        </Text>
        <Text className="mt-1 text-sm leading-5 text-ink-soft">{m.text}</Text>
        {state === "pending" && order ? (
          <View className="mt-3 flex-row gap-3">
            <Button
              title="OK, pack it"
              className="h-11 flex-1"
              onPress={() => respondQuote(order, true)}
            />
            <Button
              title="No thanks"
              variant="outline"
              className="h-11 flex-1"
              onPress={() => respondQuote(order, false)}
            />
          </View>
        ) : (
          <View
            className={`mt-3 self-start rounded-full px-3 py-1 ${state === "accepted" ? "bg-green-100" : "bg-stone-200"}`}
          >
            <Text
              className={`text-xs font-bold ${state === "accepted" ? "text-success" : "text-stone-600"}`}
            >
              {state === "accepted" ? "You said OK" : "You declined"}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

/** Two ways to pay: get an M-Pesa prompt, or pay to the Till and attach the confirmation message. */
function PayCard({
  m,
  order,
  onAttach,
}: {
  m: Message;
  order?: Order;
  onAttach: () => void;
}) {
  const { payWithPrompt, payNumbers } = useAppData();
  const [tab, setTab] = useState<"prompt" | "till">("prompt");
  const [phone, setPhone] = useState(
    payNumbers.find((p) => p.isDefault)?.number ?? "",
  );
  const [err, setErr] = useState<string>();
  const [sent, setSent] = useState(false);
  const paid = !!order && order.stage >= 1;
  const ic = useIconColor();

  const send = () => {
    if (!order) return;
    if (!isKenyanPhone(phone)) return setErr("Enter a valid M-Pesa number");
    setErr(undefined);
    setSent(true);
    payWithPrompt(order, phone.replace(/[\s-]/g, ""));
  };

  return (
    <View className="mb-3 w-[90%] self-start overflow-hidden rounded-2xl border border-brand-200 bg-white">
      <View className="flex-row items-center bg-brand-50 px-4 py-2">
        <Ionicons name="cash" size={16} color="#FA3504" />
        <Text className="ml-2 flex-1 text-xs font-bold tracking-widest text-brand-700">
          PAY {formatKsh(m.amount ?? 0)}
        </Text>
        {paid && <Text className="text-xs font-bold text-success">PAID ✓</Text>}
      </View>
      <View className="p-4">
        {paid ? (
          <Text className="text-sm text-ink-soft">
            Payment received. The shop is packing your order.
          </Text>
        ) : (
          <>
            <View className="mb-3 flex-row rounded-full bg-cream p-1">
              {(
                [
                  ["prompt", "M-Pesa prompt"],
                  ["till", "Pay to Till"],
                ] as const
              ).map(([k, l]) => (
                <Pressable
                  key={k}
                  onPress={() => setTab(k)}
                  className={`h-9 flex-1 items-center justify-center rounded-full ${tab === k ? "bg-white " : ""}`}
                >
                  <Text
                    className={`text-sm font-bold ${tab === k ? "text-ink" : "text-ink-mute"}`}
                  >
                    {l}
                  </Text>
                </Pressable>
              ))}
            </View>
            {tab === "prompt" ? (
              <>
                <Text className="text-sm leading-5 text-ink-soft">
                  We send a payment prompt straight to your phone. Just enter
                  your PIN.
                </Text>
                <View
                  className={`mt-3 h-12 flex-row items-center rounded-2xl border bg-white px-3 ${err ? "border-danger" : "border-line"}`}
                >
                  <Ionicons name="call-outline" size={18} color={ic.faint} />
                  <TextInput
                    value={phone}
                    onChangeText={(t) => {
                      setPhone(t);
                      setErr(undefined);
                    }}
                    keyboardType="phone-pad"
                    placeholder="0712 345 678"
                    placeholderTextColor={ic.faint}
                    className="ml-2 flex-1 text-base text-ink"
                    editable={!sent}
                  />
                </View>
                {err ? (
                  <Text className="mt-1 text-xs text-danger">{err}</Text>
                ) : null}
                <Button
                  title={
                    sent
                      ? "Prompt sent. Check your phone"
                      : "Send me the prompt"
                  }
                  disabled={sent}
                  className="mt-3 h-12"
                  onPress={send}
                />
              </>
            ) : (
              <>
                <Text className="text-xs font-bold tracking-widest text-ink-mute">
                  TILL NUMBER
                </Text>
                <Text
                  selectable
                  className="text-3xl font-extrabold tracking-widest text-ink"
                >
                  {m.till}
                </Text>
                <Text className="mt-1 text-xs text-ink-mute">
                  Press and hold the number to copy it. Pay{" "}
                  {formatKsh(m.amount ?? 0)}, then attach the M-Pesa message.
                </Text>
                <Button
                  title="I've paid · attach message"
                  icon="attach"
                  className="mt-3 h-12"
                  onPress={onAttach}
                />
              </>
            )}
          </>
        )}
      </View>
    </View>
  );
}

export default function ChatRoomScreen() {
  const nav = useNav();
  const route = useRoute<RouteProp<RootStackParamList, "ChatRoom">>();
  const { id, prefillQuote } = route.params;
  const { chats, orders, sendMessage, markChatRead, attachPayment } =
    useAppData();
  const { outbox } = useOffline();
  const chat = chats.find((c) => c.id === id);
  const pending = orders.find(
    (o) =>
      o.chatId === id &&
      o.stage === 0 &&
      o.quote === "accepted" &&
      !o.cancelled,
  );
  const [text, setText] = useState("");
  const [sheet, setSheet] = useState(false);
  const [proofText, setProofText] = useState("");
  const [proofImg, setProofImg] = useState<string>();
  const ic = useIconColor();

  // Auto-send quote request on mount if prefillQuote is present
  useEffect(() => {
    if (!prefillQuote) return;
    let cancelled = false;
    (async () => {
      try {
        await api.post(`/chats/${id}/messages`, {
          body: "",
          kind: "quote_request",
          product_id: prefillQuote.productId,
          qty: prefillQuote.qty,
          budget: prefillQuote.budget,
        });
        if (!cancelled) {
          nav.setParams({ prefillQuote: undefined });
        }
      } catch (e) {
        console.error("quote_request send failed", e);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    markChatRead(id);
  }, [id, markChatRead, chat?.messages.length]);
  if (!chat) return null;

  const send = (t = text) => {
    const v = t.trim();
    if (!v) return;
    sendMessage(id, v);
    setText("");
  };
  const sendPhoto = () =>
    Alert.alert("Send a photo", undefined, [
      {
        text: "Take photo",
        onPress: async () => {
          const u = await pickImage(true);
          if (u) sendMessage(id, "Photo", u);
        },
      },
      {
        text: "Choose from gallery",
        onPress: async () => {
          const u = await pickImage(false);
          if (u) sendMessage(id, "Photo", u);
        },
      },
      { text: "Cancel", style: "cancel" },
    ]);
  const submitProof = () => {
    if (!pending) return;
    attachPayment(pending.id, id, { text: proofText, imageUri: proofImg });
    setSheet(false);
    setProofText("");
    setProofImg(undefined);
  };
  const canSend = proofText.trim().length >= 10 || !!proofImg;

  const renderMsg = (m: Message) => {
    const mine = m.from === "me";
    const order = m.orderId
      ? orders.find((o) => o.id === m.orderId)
      : undefined;

    // NEW: quote_request card
    if (m.kind === ("quote_request" as any)) {
      const meta = (() => {
        try {
          return JSON.parse(m.text || "{}");
        } catch {
          return {};
        }
      })();
      return (
        <View className="mb-3 w-[86%] self-end rounded-2xl border border-brand-200 bg-brand-50 p-4">
          <Text className="text-xs font-bold tracking-widest text-brand-700">
            QUOTE REQUEST
          </Text>
          <Text className="mt-1 text-base font-bold text-ink dark:text-sink">
            {meta.qty ?? "?"} pieces
          </Text>
          {meta.budget ? (
            <Text className="mt-1 text-sm text-ink-soft dark:text-sink-soft">
              Target total: {formatKsh(meta.budget)}
            </Text>
          ) : null}
          <Text className="mt-2 text-xs text-ink-mute dark:text-sink-mute">
            Waiting for the shop to reply with a price.
          </Text>
        </View>
      );
    }

    if (m.kind === "quote") return <QuoteCard m={m} order={order} />;
    if (m.kind === "till")
      return <PayCard m={m} order={order} onAttach={() => setSheet(true)} />;
    if (m.kind === "payment") {
      return (
        <View className="mb-3 max-w-[86%] self-end overflow-hidden rounded-2xl rounded-br-sm bg-brand-500">
          <View className="flex-row items-center px-4 pt-2.5">
            <Ionicons name="receipt" size={14} color="#fff" />
            <Text className="ml-1.5 text-xs font-bold tracking-widest text-white-90">
              PAYMENT PROOF
            </Text>
          </View>
          {m.imageUri ? (
            <Image
              source={{ uri: m.imageUri }}
              className="mx-3 mt-2 h-40 rounded-xl"
              resizeMode="cover"
            />
          ) : null}
          <Text className="px-4 pb-3 pt-2 text-sm text-white">{m.text}</Text>
        </View>
      );
    }

    const queued =
      mine &&
      outbox.some(
        (o) =>
          o.chatId === id &&
          o.text === m.text &&
          Math.abs(o.createdAt - m.at) < 2000,
      );
    return (
      <View
        className={`mb-2 max-w-[80%] overflow-hidden rounded-2xl ${
          mine
            ? "self-end rounded-br-sm bg-brand-500"
            : "self-start rounded-bl-sm border border-line dark:border-surface-line bg-white dark:bg-surface"
        }`}
      >
        {m.imageUri ? (
          <Image
            source={{ uri: m.imageUri }}
            className="h-44 w-56"
            resizeMode="cover"
          />
        ) : null}
        {m.text && !(m.imageUri && m.text === "Photo") ? (
          <Text
            className={`px-4 pt-2.5 text-base ${
              queued ? "" : "pb-2.5"
            } ${mine ? "text-white" : "text-ink dark:text-sink"}`}
          >
            {m.text}
          </Text>
        ) : null}
        {queued && (
          <View className="flex-row items-center justify-end px-4 pb-2 pt-0.5">
            <Ionicons
              name="time-outline"
              size={11}
              color="rgba(255,255,255,0.8)"
            />
            <Text className="ml-1 text-[10px] font-medium text-white-80">
              Waiting to send
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-cream">
      <View className="flex-row items-center border-b border-line bg-white px-4 py-2.5">
        <Pressable
          hitSlop={12}
          onPress={() => nav.goBack()}
          accessibilityLabel="Go back"
          className="mr-2 h-10 w-10 items-center justify-center rounded-full bg-cream"
        >
          <Ionicons name="arrow-back" size={20} color={ic.primary} />
        </Pressable>
        <Pressable
          disabled={!chat.supplierId}
          onPress={() =>
            chat.supplierId &&
            nav.navigate("SupplierProfile", { id: chat.supplierId })
          }
          className="flex-1 flex-row items-center"
        >
          <View className="h-10 w-10 items-center justify-center rounded-full bg-brand-500">
            <Text className="text-base font-bold text-white">
              {chat.name.charAt(0)}
            </Text>
          </View>
          <View className="ml-3 flex-1">
            <Text numberOfLines={1} className="text-base font-bold text-ink">
              {chat.name}
            </Text>
            <OnlineStatus online={chat.online} lastSeen={chat.lastSeen} />
          </View>
        </Pressable>
        <Pressable
          hitSlop={10}
          onPress={() =>
            nav.navigate("Call", { name: chat.name, role: chat.role })
          }
          accessibilityLabel="Call"
          className="h-10 w-10 items-center justify-center rounded-full bg-brand-50"
        >
          <Ionicons name="call" size={18} color="#FA3504" />
        </Pressable>
      </View>

      {pending && (
        <Pressable
          onPress={() => setSheet(true)}
          className="flex-row items-center bg-amber-50 px-4 py-2.5"
        >
          <Ionicons name="time" size={16} color="#B7791F" />
          <Text className="ml-2 flex-1 text-sm text-amber-800">
            Awaiting payment of {formatKsh(pending.price)}. Paid already? Tap to
            attach your M-Pesa message.
          </Text>
          <Ionicons name="chevron-forward" size={16} color="#B7791F" />
        </Pressable>
      )}

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <FlatList
          inverted
          className="flex-1 px-4"
          data={[...chat.messages].reverse()}
          keyExtractor={(m) => m.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingVertical: 12 }}
          renderItem={({ item }) => renderMsg(item)}
        />

        <View className="max-h-12">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16 }}
            keyboardShouldPersistTaps="handled"
          >
            {pending && (
              <Pressable
                onPress={() => setSheet(true)}
                className="mr-2 h-9 justify-center rounded-full bg-brand-500 px-3.5"
              >
                <Text className="text-sm font-semibold text-white">
                  I've paid
                </Text>
              </Pressable>
            )}
            {QUICK.map((q) => (
              <Pressable
                key={q}
                onPress={() => send(q)}
                className="mr-2 h-9 justify-center rounded-full border border-brand-200 bg-brand-50 px-3.5"
              >
                <Text className="text-sm font-medium text-brand-700">{q}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        <View className="flex-row items-center px-4 pb-3 pt-2">
          <Pressable
            onPress={sendPhoto}
            accessibilityLabel="Send a photo"
            className="mr-2 h-12 w-12 items-center justify-center rounded-full border border-line bg-white"
          >
            <Ionicons name="camera-outline" size={22} color={ic.muted} />
          </Pressable>
          <View className="mr-2 h-12 flex-1 justify-center rounded-full border border-line bg-white px-4">
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder="Message"
              placeholderTextColor={ic.faint}
              className="text-base text-ink"
              returnKeyType="send"
              onSubmitEditing={() => send()}
            />
          </View>
          <Pressable
            onPress={() => send()}
            accessibilityLabel="Send"
            disabled={!text.trim()}
            className={`h-12 w-12 items-center justify-center rounded-full ${text.trim() ? "bg-brand-500" : "bg-brand-200"}`}
          >
            <Ionicons name="send" size={18} color="#fff" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      <Modal
        visible={sheet}
        transparent
        animationType="slide"
        onRequestClose={() => setSheet(false)}
      >
        <KeyboardAvoidingView
          className="flex-1 justify-end bg-black-40"
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <Pressable className="flex-1" onPress={() => setSheet(false)} />
          <View className="rounded-t-[28px] bg-white px-5 pb-8 pt-3">
            <View className="mb-3 h-1.5 w-12 self-center rounded-full bg-line" />
            <Text className="text-xl font-extrabold text-ink">
              Attach payment proof
            </Text>
            <Text className="mt-1 text-sm leading-5 text-ink-soft">
              Paste the M-Pesa confirmation SMS
              {pending ? ` for ${formatKsh(pending.price)}` : ""}, or attach a
              screenshot.
            </Text>
            <View className="mt-4 min-h-[100px] rounded-2xl border border-line bg-cream px-4 py-3">
              <TextInput
                multiline
                value={proofText}
                onChangeText={setProofText}
                placeholder="SJK2L9M4PQ Confirmed. Ksh1,200.00 paid to…"
                placeholderTextColor={ic.faint}
                className="text-base text-ink"
                style={{ minHeight: 76, textAlignVertical: "top" }}
              />
            </View>
            {proofImg ? (
              <View className="mt-3 h-32 overflow-hidden rounded-2xl">
                <Image
                  source={{ uri: proofImg }}
                  className="h-full w-full"
                  resizeMode="cover"
                />
                <Pressable
                  onPress={() => setProofImg(undefined)}
                  className="absolute right-2 top-2 h-8 w-8 items-center justify-center rounded-full bg-black-60"
                >
                  <Ionicons name="close" size={18} color="#fff" />
                </Pressable>
              </View>
            ) : (
              <Pressable
                onPress={async () => {
                  const u = await pickImage(false);
                  if (u) setProofImg(u);
                }}
                className="mt-3 h-12 flex-row items-center justify-center rounded-2xl border border-dashed border-brand-400 bg-brand-50"
              >
                <Ionicons name="image-outline" size={18} color="#FA3504" />
                <Text className="ml-2 text-sm font-semibold text-brand-600">
                  Attach a screenshot
                </Text>
              </Pressable>
            )}
            <Button
              title="Send proof to supplier"
              className="mt-4"
              disabled={!canSend}
              onPress={submitProof}
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}
