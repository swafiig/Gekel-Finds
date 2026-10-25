import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { CheckCircle2 } from "lucide-react-native";
import { useState } from "react";
import { Text, View } from "react-native";
import { OtpInput } from "../../components/OtpInput";
import { PhotoField } from "../../components/PhotoField";
import { Banner, Button, Card, Header, QueryBoundary, Screen } from "../../components/ui";
import { useQuery } from "../../hooks/useQuery";
import { api, Delivery, MOCK_HINTS, USING_MOCK } from "../../lib/api";
import { callNumber } from "../../lib/maps";
import { money } from "../../lib/format";
import type { RiderStackParams } from "../../navigation/types";
import { c } from "../../theme/tokens";

type Props = NativeStackScreenProps<RiderStackParams, "Handover">;
const MAX_TRIES = 5;

export function Handover({ route, navigation }: Props) {
  const { id } = route.params;
  const q = useQuery(() => api.getActiveDelivery(), [id]);
  const d = q.data;
  const [otp, setOtp] = useState("");
  const [photo, setPhoto] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tries, setTries] = useState(0);
  const [done, setDone] = useState<Delivery | null>(null);

  const submit = async () => {
    if (!d || !photo || otp.length !== 4 || busy) return;
    setBusy(true);
    setError(null);
    try {
      const r = await api.completeDelivery(d.id, { otp, photoUri: photo });
      setDone(r);
    } catch (e: any) {
      setTries((t) => t + 1);
      setOtp("");
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <Screen scroll={false} footer={<Button label="Back to radar" onPress={() => navigation.popToTop()} />}>
        <View className="flex-1 items-center justify-center px-4">
          <View className="h-20 w-20 items-center justify-center rounded-full bg-success/10">
            <CheckCircle2 size={44} color={c.success} />
          </View>
          <Text className="mt-5 text-[26px] font-extrabold text-ink">Delivered</Text>
          <Text className="mt-1 text-center text-[15px] text-ink-soft">{done.orderCode} was handed over to {done.dropoff.name}.</Text>
          <Text className="mt-5 text-[12px] font-semibold uppercase tracking-wider text-ink-soft">You earned</Text>
          <Text className="text-[38px] font-extrabold text-ink">{money(done.payout)}</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen
      keyboard
      header={<Header title="Handover" subtitle={d ? `${d.orderCode} · ${d.dropoff.name}` : undefined} onBack={() => navigation.popToTop()} />}
      footer={<Button label="Complete delivery" onPress={submit} loading={busy} disabled={!photo || otp.length !== 4 || tries >= MAX_TRIES} />}
    >
      <QueryBoundary loading={q.loading} error={q.error} onRetry={q.refetch}>
        {!d ? (
          <Banner tone="neutral">No active delivery.</Banner>
        ) : (
          <>
            {error ? <Banner tone="danger">{error}</Banner> : null}
            {tries >= MAX_TRIES ? <Banner tone="danger">Too many wrong codes. Call the customer, or contact GEKEL support.</Banner> : null}
            {USING_MOCK ? <Banner tone="brand">Demo mode: the customer's code is {MOCK_HINTS.deliveryPin} for the sample job.</Banner> : null}

            <Card>
              <Text className="text-[15px] font-bold text-ink">Customer release code</Text>
              <Text className="mb-4 mt-1 text-[14px] text-ink-soft">Ask {d.dropoff.name} for the 4-digit code in their GEKEL app. Don't hand over the parcel without it.</Text>
              <OtpInput value={otp} onChange={(v) => { setOtp(v); setError(null); }} length={4} error={!!error} />
              <View className="mt-4">
                <Button label="Call customer" variant="outline" small onPress={() => callNumber(d.dropoff.phone)} />
              </View>
            </Card>

            <Text className="mb-2 mt-5 text-[13px] font-semibold uppercase tracking-wider text-ink-soft">Handover photo</Text>
            <PhotoField source="camera" value={photo} onChange={setPhoto} hint="Parcel with the seal visible, in the customer's hands or at the door." aspect={1.4} />
          </>
        )}
      </QueryBoundary>
    </Screen>
  );
}
