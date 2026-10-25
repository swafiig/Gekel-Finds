import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { MessageCircle } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { Banner, Button, Card, Divider, Field, Header, QueryBoundary, Row, Screen, Thumb } from "../../components/ui";
import { useQuery } from "../../hooks/useQuery";
import { api } from "../../lib/api";
import { countdown, money } from "../../lib/format";
import type { SupplierStackParams } from "../../navigation/types";

type Props = NativeStackScreenProps<SupplierStackParams, "RfqDetail">;
const READY = [15, 30, 60, 120];
const readyLabel = (m: number) => (m < 60 ? `${m} min` : `${m / 60} hr`);

export function RfqDetail({ route, navigation }: Props) {
  const { id } = route.params;
  const q = useQuery(() => api.getRfq(id), [id]);
  const r = q.data;

  const [price, setPrice] = useState("");
  const [ready, setReady] = useState(30);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pre-fill from an existing quote so "Update quote" starts from what was sent.
  useEffect(() => {
    if (r?.quote) {
      setPrice(String(r.quote.price));
      setReady(r.quote.readyInMins);
      setNote(r.quote.note ?? "");
    }
  }, [r?.quote?.price, r?.quote?.readyInMins, r?.quote?.note]);

  const live = r && (r.status === "open" || r.status === "quoted");
  const priceNum = Number(price.replace(/,/g, ""));
  const overBudget = !!r?.budget && priceNum > r.budget;

  const submit = async () => {
    if (!r) return;
    if (!(priceNum > 0)) return setError("Enter your total price for the whole request.");
    setBusy(true);
    setError(null);
    try {
      const next = await api.submitQuote(r.id, { price: priceNum, readyInMins: ready, note: note.trim() || undefined });
      q.setData(next);
      Alert.alert("Quote sent", "The buyer has been notified. You'll see it move to an order if they accept.", [{ text: "OK", onPress: () => navigation.goBack() }]);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const decline = () => {
    if (!r) return;
    const go = async (reason: "out_of_stock" | "cannot_fulfil") => {
      try {
        await api.declineRfq(r.id, reason);
        navigation.goBack();
      } catch (e: any) {
        setError(e.message);
      }
    };
    Alert.alert("Can't fulfil this request?", "The buyer will be told it isn't available from you.", [
      { text: "Out of stock", onPress: () => void go("out_of_stock") },
      { text: "Can't fulfil", onPress: () => void go("cannot_fulfil") },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  return (
    <Screen
      keyboard
      header={<Header title={r?.code ?? "Request"} onBack={() => navigation.goBack()} />}
      footer={live ? <Button label={r?.status === "quoted" ? "Update quote" : "Send quote"} onPress={submit} loading={busy} /> : undefined}
    >
      <QueryBoundary loading={q.loading} error={q.error} onRetry={q.refetch}>
        {r ? (
          <>
            {error ? <Banner tone="danger">{error}</Banner> : null}
            <Card>
              <View className="flex-row">
                <Thumb uri={r.photoUri} size={72} />
                <View className="ml-3 flex-1">
                  <Text className="text-[18px] font-bold text-ink">{r.title}</Text>
                  <Text className="mt-0.5 text-[14px] text-ink-soft">{r.qty} {r.unit}</Text>
                </View>
              </View>
              {r.description ? <Text className="mt-3 text-[14px] leading-5 text-ink">{r.description}</Text> : null}
              <Divider />
              <Row label="Buyer" value={`${r.buyerName} · ${r.buyerArea}`} />
              {r.budget ? <Row label="Buyer budget" value={money(r.budget)} strong /> : null}
              {live ? <Row label="Closes in" value={countdown(r.expiresAt)} /> : null}
              {r.threadId ? (
                <Pressable onPress={() => navigation.navigate("ChatThread", { id: r.threadId!, title: r.buyerName, subtitle: r.code })} className="mt-3 flex-row items-center">
                  <MessageCircle size={16} color="#DC3228" />
                  <Text className="ml-2 text-[14px] font-semibold text-brand-600">Chat with {r.buyerName}</Text>
                </Pressable>
              ) : null}
            </Card>

            {live ? (
              <>
                <Text className="mb-2 mt-5 text-[13px] font-semibold uppercase tracking-wider text-ink-soft">Your quote</Text>
                <Field label="Total price" prefix="KSh" keyboardType="number-pad" value={price} onChangeText={(t) => { setPrice(t.replace(/[^\d]/g, "")); setError(null); }} placeholder="0" hint={overBudget ? `Above the buyer's budget of ${money(r.budget!)}. They may counter.` : "Price for the full quantity. Item cost only: GEKEL adds its own fee."} />
                <Text className="mb-1.5 text-[13px] font-semibold text-ink">Ready for pickup in</Text>
                <View className="mb-4 flex-row" style={{ gap: 8 }}>
                  {READY.map((m) => (
                    <Pressable key={m} onPress={() => setReady(m)} accessibilityState={{ selected: ready === m }} className={`h-11 flex-1 items-center justify-center rounded-xl border ${ready === m ? "border-ink bg-ink" : "border-line bg-white"}`}>
                      <Text className={`text-[14px] font-semibold ${ready === m ? "text-white" : "text-ink"}`}>{readyLabel(m)}</Text>
                    </Pressable>
                  ))}
                </View>
                <Field label="Note to buyer (optional)" value={note} onChangeText={setNote} placeholder="Stock details, packing, anything to confirm" multiline />
                <Button label="I can't fulfil this" variant="danger" small onPress={decline} />
              </>
            ) : (
              <Banner tone="neutral">This request is {r.status}.</Banner>
            )}
          </>
        ) : null}
      </QueryBoundary>
    </Screen>
  );
}
