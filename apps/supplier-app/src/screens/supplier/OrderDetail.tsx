import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import * as Clipboard from "expo-clipboard";
import { Copy, MessageCircle, Phone } from "lucide-react-native";
import { useCallback, useState } from "react";
import { Alert, Image, Linking, Pressable, Text, View } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { Banner, Button, Card, Divider, Field, Header, Pill, QueryBoundary, Row, Screen, SectionTitle } from "../../components/ui";
import { Timeline } from "../../components/Timeline";
import { useQuery } from "../../hooks/useQuery";
import { api } from "../../lib/api";
import { clock, money } from "../../lib/format";
import { nextAction, STATUS_LABEL, stepIndex } from "../../lib/orderStatus";
import type { SupplierStackParams } from "../../navigation/types";
import { c } from "../../theme/tokens";

type Props = NativeStackScreenProps<SupplierStackParams, "OrderDetail">;

export function OrderDetail({ route, navigation }: Props) {
  const { id } = route.params;
  const q = useQuery(() => api.getOrder(id), [id], { refreshMs: 15_000 });
  const o = q.data;
  const profile = useQuery(() => api.getSupplierProfile(), []);

  const [received, setReceived] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Coming back from PackProof should show the new status immediately.
  useFocusEffect(useCallback(() => void q.refetch(), [])); // eslint-disable-line react-hooks/exhaustive-deps

  const act = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
      await q.refetch();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const confirmPayment = () => {
    if (!o) return;
    const amt = Number(received.replace(/,/g, ""));
    if (!(amt > 0)) return setError("Type the amount you see in your M-Pesa message.");
    void act(() => api.confirmPayment(o.id, amt));
  };

  const reportProblem = () => {
    if (!o) return;
    const go = (reason: string) => void act(() => api.disputePayment(o.id, reason));
    Alert.alert("What's wrong with the payment?", "The buyer will be asked to pay or re-send the code.", [
      { text: "Amount is short", onPress: () => go("Amount received is less than the order total") },
      { text: "Code not found", onPress: () => go("M-Pesa code not found on my Till") },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const status = o ? STATUS_LABEL[o.status] : null;
  const hint = o ? nextAction(o) : null;

  return (
    <Screen
      keyboard
      header={<Header title={o?.code ?? "Order"} onBack={() => navigation.goBack()} right={status ? <Pill label={status.label} tone={status.tone} /> : undefined} />}
      footer={
        o?.status === "paid" ? (
          <Button label="Pack order and add proof photo" onPress={() => navigation.navigate("PackProof", { id: o.id })} />
        ) : o?.status === "packed" ? (
          <Button label="Mark ready for pickup" onPress={() => void act(() => api.markReady(o.id))} loading={busy} />
        ) : undefined
      }
    >
      <QueryBoundary loading={q.loading} error={q.error} onRetry={q.refetch}>
        {o ? (
          <>
            {error ? <Banner tone="danger">{error}</Banner> : null}
            {hint && o.status !== "delivered" ? <Banner tone="brand">{hint}</Banner> : null}

            <Card>
              {o.items.map((it, i) => (
                <View key={i} className="flex-row items-center justify-between py-1">
                  <Text className="flex-1 pr-3 text-[15px] text-ink">{it.qty}× {it.name}</Text>
                  <Text className="text-[15px] font-semibold text-ink">{money(it.qty * it.unitPrice)}</Text>
                </View>
              ))}
              <Divider />
              <Row label="Paid to your Till" value={money(o.itemsTotal)} strong />
              <Text className="mt-1 text-[12px] text-ink-mute">GEKEL's delivery and service fee ({money(o.gekelFee)}) is paid by the buyer to GEKEL, separately.</Text>
            </Card>

            {o.buyerNote ? (
              <Card className="mt-3">
                <Text className="text-[11px] font-bold uppercase tracking-wider text-ink-soft">Note from {o.buyerName}</Text>
                <Text className="mt-1 text-[15px] text-ink">“{o.buyerNote}”</Text>
              </Card>
            ) : null}

            {o.status === "awaiting_payment" ? (
              <Card className="mt-3">
                <Text className="text-[15px] font-bold text-ink">Waiting for payment</Text>
                <Text className="mt-1 text-[14px] text-ink-soft">The buyer pays {money(o.itemsTotal)} to your Till {profile.data?.tillNumber ?? ""}, then enters the M-Pesa code. You'll be asked to confirm it here.</Text>
              </Card>
            ) : null}

            {o.status === "payment_submitted" && o.payment ? (
              <Card className="mt-3">
                <Text className="text-[15px] font-bold text-ink">Confirm the payment</Text>
                <Text className="mt-1 text-[14px] text-ink-soft">Open your M-Pesa messages and look for this code.</Text>
                <View className="my-3 flex-row items-center justify-between rounded-xl bg-sink px-3 py-3">
                  <Text className="text-[20px] font-extrabold tracking-widest text-ink">{o.payment.mpesaCode}</Text>
                  <Pressable onPress={() => void Clipboard.setStringAsync(o.payment!.mpesaCode)} hitSlop={10} accessibilityLabel="Copy M-Pesa code">
                    <Copy size={18} color={c.inkSoft} />
                  </Pressable>
                </View>
                <Row label="Buyer says they paid" value={money(o.payment.amount)} />
                <Row label="Sent at" value={clock(o.payment.submittedAt)} />
                <View className="mt-3">
                  <Field label="Amount you received" prefix="KSh" keyboardType="number-pad" value={received} onChangeText={(t) => { setReceived(t.replace(/[^\d]/g, "")); setError(null); }} placeholder={String(o.itemsTotal)} hint="Type it from your M-Pesa message. It must match the order total." />
                </View>
                <Button label="Payment received" onPress={confirmPayment} loading={busy} disabled={received === ""} />
                <View className="h-2" />
                <Button label="Something's wrong" variant="outline" small onPress={reportProblem} />
              </Card>
            ) : null}

            {o.status === "ready" && o.handoffCode ? (
              <Card className="mt-3 items-center">
                <Text className="text-[15px] font-bold text-ink">Handoff code</Text>
                <Text className="mb-3 mt-1 text-center text-[13px] text-ink-soft">The rider scans this or types the code before taking the parcel.</Text>
                <QRCode value={o.handoffCode} size={160} />
                <Text className="mt-3 text-[22px] font-extrabold tracking-widest text-ink">{o.handoffCode}</Text>
              </Card>
            ) : null}

            {o.pack ? (
              <>
                <SectionTitle title="Packing proof" />
                <Card className="p-2">
                  <Image source={{ uri: o.pack.photoUri }} className="h-48 w-full rounded-xl bg-sink" resizeMode="cover" />
                  <View className="px-2 py-2">
                    <Row label="Photographed" value={clock(o.pack.at)} />
                    {o.pack.sealSerial ? <Row label="Seal serial" value={o.pack.sealSerial} mono /> : null}
                  </View>
                </Card>
              </>
            ) : null}

            {o.rider ? (
              <>
                <SectionTitle title="Rider" />
                <Card>
                  <Text className="text-[16px] font-bold text-ink">{o.rider.name}</Text>
                  <Text className="text-[13px] text-ink-soft">{o.rider.plate}{o.rider.etaMins && o.status === "ready" ? ` · arriving in about ${o.rider.etaMins} min` : ""}</Text>
                </Card>
              </>
            ) : null}

            <SectionTitle title="Progress" />
            <Card>
              <Timeline
                current={stepIndex(o.status)}
                steps={[
                  { label: "Buyer pays your Till" },
                  { label: "You confirm payment", detail: o.payment ? `Code ${o.payment.mpesaCode}` : undefined },
                  { label: "Pack with proof photo" },
                  { label: "Mark ready for pickup" },
                  { label: "Rider collects" },
                  { label: "Delivered" },
                ]}
              />
            </Card>

            <View className="mt-3 flex-row" style={{ gap: 10 }}>
              {o.threadId ? <Button className="flex-1" label="Chat" icon={MessageCircle} variant="outline" small onPress={() => navigation.navigate("ChatThread", { id: o.threadId!, title: o.buyerName, subtitle: o.code })} /> : null}
              <Button className="flex-1" label="Support" icon={Phone} variant="outline" small onPress={() => void Linking.openURL(`https://wa.me/${process.env.EXPO_PUBLIC_SUPPORT_WHATSAPP ?? "254700123456"}?text=${encodeURIComponent(`Help with order ${o.code}`)}`)} />
            </View>
          </>
        ) : null}
      </QueryBoundary>
    </Screen>
  );
}
