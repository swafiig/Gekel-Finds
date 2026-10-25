import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { MapPin, MessageSquare, Navigation, Phone } from "lucide-react-native";
import { useState } from "react";
import { Linking, Text, View } from "react-native";
import { SlideToConfirm } from "../../components/SlideToConfirm";
import { Banner, Button, Card, Header, QueryBoundary, Screen } from "../../components/ui";
import { useLocationBroadcast } from "../../hooks/useLocationBroadcast";
import { useQuery } from "../../hooks/useQuery";
import { api } from "../../lib/api";
import { money } from "../../lib/format";
import { callNumber, openDirections } from "../../lib/maps";
import type { RiderStackParams } from "../../navigation/types";
import { c } from "../../theme/tokens";

type Props = NativeStackScreenProps<RiderStackParams, "Transit">;

export function Transit({ route, navigation }: Props) {
  const { id } = route.params;
  const q = useQuery(() => api.getActiveDelivery(), [id]);
  const d = q.data;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // The buyer's tracking screen reads this stream.
  useLocationBroadcast(!!d, d?.id);

  const arrived = async () => {
    if (!d || busy) return;
    setBusy(true);
    setError(null);
    try {
      if (d.stage === "picked_up") await api.startTransit(d.id);
      await api.markArrived(d.id);
      navigation.replace("Handover", { id: d.id });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen
      header={<Header title="On the way" subtitle={d ? `${d.orderCode} · ${d.distanceKm.toFixed(1)} km` : undefined} onBack={() => navigation.popToTop()} />}
      footer={d ? <SlideToConfirm label="Slide when you arrive" onConfirm={arrived} disabled={busy} /> : undefined}
    >
      <QueryBoundary loading={q.loading} error={q.error} onRetry={q.refetch}>
        {!d ? (
          <Banner tone="neutral">No active delivery.</Banner>
        ) : (
          <>
            {error ? <Banner tone="danger">{error}</Banner> : null}
            <View className="rounded-2xl bg-ink p-5">
              <Text className="text-[12px] font-semibold uppercase tracking-wider text-sink-soft">Deliver to</Text>
              <Text className="mt-1 text-[22px] font-extrabold text-white">{d.dropoff.name}</Text>
              <Text className="mt-0.5 text-[15px] text-sink-soft">{d.dropoff.detail}</Text>
              <Text className="text-[15px] text-sink-soft">{d.dropoff.area}</Text>
              <View className="mt-4">
                <Button label="Open navigation" icon={Navigation} onPress={() => openDirections(d.dropoff.point, d.dropoff.name)} />
              </View>
            </View>

            <View className="mt-3 flex-row" style={{ gap: 10 }}>
              <Button className="flex-1" label="Call customer" icon={Phone} variant="outline" onPress={() => callNumber(d.dropoff.phone)} />
              {d.dropoff.phone ? <Button className="flex-1" label="SMS" icon={MessageSquare} variant="outline" onPress={() => void Linking.openURL(`sms:${d.dropoff.phone}`)} /> : null}
            </View>

            {d.dropoff.note ? (
              <Card className="mt-3">
                <Text className="text-[11px] font-bold uppercase tracking-wider text-ink-soft">Note from {d.dropoff.name}</Text>
                <Text className="mt-1 text-[15px] text-ink">“{d.dropoff.note}”</Text>
              </Card>
            ) : null}

            <Card className="mt-3 flex-row items-center justify-between">
              <View className="flex-row items-center">
                <MapPin size={16} color={c.inkSoft} />
                <Text className="ml-2 text-[14px] text-ink-soft">Your payout</Text>
              </View>
              <Text className="text-[18px] font-extrabold text-ink">{money(d.payout)}</Text>
            </Card>
            <Text className="mt-3 px-2 text-center text-[12px] text-ink-mute">Your live position is shared with the customer until you finish.</Text>
          </>
        )}
      </QueryBoundary>
    </Screen>
  );
}
