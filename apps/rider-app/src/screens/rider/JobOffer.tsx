import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { AlertTriangle, Clock, MapPin, Navigation, Package } from "lucide-react-native";
import { ReactNode, useRef, useState } from "react";
import { Text, View } from "react-native";
import { Banner, Button, Card, Header, QueryBoundary, Screen } from "../../components/ui";
import { SlideToConfirm } from "../../components/SlideToConfirm";
import { useQuery } from "../../hooks/useQuery";
import { useTick } from "../../hooks/useTick";
import { api } from "../../lib/api";
import { countdown, money } from "../../lib/format";
import type { RiderStackParams } from "../../navigation/types";
import { c } from "../../theme/tokens";

type Props = NativeStackScreenProps<RiderStackParams, "JobOffer">;

export function JobOffer({ route, navigation }: Props) {
  const { id } = route.params;
  useTick(1000);
  const q = useQuery(async () => (await api.listOffers()).find((j) => j.id === id) ?? null, [id]);
  const job = q.data;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const accepting = useRef(false);

  const expired = !!job && +new Date(job.expiresAt) <= Date.now();

  const accept = async () => {
    if (!job || accepting.current) return;
    accepting.current = true;
    setBusy(true);
    setError(null);
    try {
      const d = await api.acceptJob(job.id);
      navigation.replace("Pickup", { id: d.id });
    } catch (e: any) {
      setError(e.message);
      accepting.current = false;
    } finally {
      setBusy(false);
    }
  };

  const decline = async () => {
    if (job) await api.declineJob(job.id).catch(() => {});
    navigation.goBack();
  };

  return (
    <Screen
      header={<Header title="Job offer" onBack={() => navigation.goBack()} />}
      footer={
        job && !expired ? (
          <View style={{ gap: 10 }}>
            <SlideToConfirm label="Slide to accept" onConfirm={accept} disabled={busy} />
            <Button label="Decline" variant="outline" small onPress={decline} disabled={busy} />
          </View>
        ) : (
          <Button label="Back to radar" onPress={() => navigation.goBack()} />
        )
      }
    >
      <QueryBoundary loading={q.loading} error={q.error} onRetry={q.refetch}>
        {!job ? (
          <Banner tone="neutral">This job was taken by another rider or has been withdrawn.</Banner>
        ) : (
          <>
            {error ? <Banner tone="danger">{error}</Banner> : null}
            {expired ? <Banner tone="neutral">This offer has expired.</Banner> : null}

            <View className="rounded-2xl bg-ink p-5">
              <View className="flex-row items-start justify-between">
                <View>
                  <Text className="text-[12px] font-semibold uppercase tracking-wider text-sink-soft">Guaranteed payout</Text>
                  <Text className="text-[38px] font-extrabold text-white">{money(job.payout)}</Text>
                </View>
                {!expired ? (
                  <View className="flex-row items-center rounded-full bg-white-15 px-3 py-1.5">
                    <Clock size={14} color={c.white} />
                    <Text className="ml-1.5 text-[13px] font-bold text-white">{countdown(job.expiresAt)}</Text>
                  </View>
                ) : null}
              </View>
              <View className="mt-3 flex-row" style={{ gap: 20 }}>
                <View className="flex-row items-center">
                  <Navigation size={14} color={c.white} />
                  <Text className="ml-1.5 text-[14px] font-semibold text-white">{job.distanceKm.toFixed(1)} km</Text>
                </View>
                <View className="flex-row items-center">
                  <Clock size={14} color={c.white} />
                  <Text className="ml-1.5 text-[14px] font-semibold text-white">about {job.etaMins} min</Text>
                </View>
              </View>
            </View>

            <Card className="mt-3">
              <Stop icon={<MapPin size={16} color={c.white} />} bg="bg-brand-500" kind="Pickup" name={job.pickup.name} detail={job.pickup.detail} />
              <View className="my-1 ml-[15px] h-5 w-0.5 bg-line" />
              <Stop icon={<MapPin size={16} color={c.white} />} bg="bg-ink" kind="Drop-off" name={job.dropoff.area} detail={job.dropoff.detail} />
            </Card>

            <Card className="mt-3">
              <View className="flex-row items-center">
                <Package size={18} color={c.inkSoft} />
                <Text className="ml-2 flex-1 text-[15px] font-semibold text-ink">{job.parcel}</Text>
              </View>
              {job.fragile ? (
                <View className="mt-3 flex-row items-center rounded-xl bg-brand-50 px-3 py-2">
                  <AlertTriangle size={16} color={c.brand600} />
                  <Text className="ml-2 flex-1 text-[13px] font-medium text-brand-700">Fragile. Keep it upright and check the seal before you leave.</Text>
                </View>
              ) : null}
            </Card>
          </>
        )}
      </QueryBoundary>
    </Screen>
  );
}

function Stop({ icon, bg, kind, name, detail }: { icon: ReactNode; bg: string; kind: string; name: string; detail: string }) {
  return (
    <View className="flex-row items-start">
      <View className={`h-8 w-8 items-center justify-center rounded-full ${bg}`}>{icon}</View>
      <View className="ml-3 flex-1">
        <Text className="text-[11px] font-bold uppercase tracking-wider text-ink-soft">{kind}</Text>
        <Text className="text-[16px] font-bold text-ink">{name}</Text>
        <Text className="text-[13px] text-ink-soft">{detail}</Text>
      </View>
    </View>
  );
}
