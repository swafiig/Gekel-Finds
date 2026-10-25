import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ChevronRight, MapPin, Power, Radar as RadarIcon } from "lucide-react-native";
import { useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { Logo } from "../../components/Logo";
import { Banner, Card, Empty, Header, Pill, QueryBoundary, Screen, SectionTitle } from "../../components/ui";
import { useLocationBroadcast } from "../../hooks/useLocationBroadcast";
import { useQuery } from "../../hooks/useQuery";
import { useTick } from "../../hooks/useTick";
import { api, Job } from "../../lib/api";
import { countdown, money } from "../../lib/format";
import { routeForStage } from "../../lib/riderFlow";
import type { RiderStackParams } from "../../navigation/types";
import { useAuth } from "../../store/auth";
import { c } from "../../theme/tokens";

type Nav = NativeStackNavigationProp<RiderStackParams>;

export function Radar() {
  const nav = useNavigation<Nav>();
  const user = useAuth((s) => s.user);
  useTick(1000);
  const profile = useQuery(() => api.getRiderProfile(), []);
  const active = useQuery(() => api.getActiveDelivery(), [], { refreshMs: 10_000 });
  const online = !!profile.data?.online;
  const offers = useQuery(() => api.listOffers(), [online], { refreshMs: 5000, enabled: online });
  const earnings = useQuery(() => api.getEarnings(), []);
  const [toggling, setToggling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useLocationBroadcast(online || !!active.data, active.data?.id);

  const toggle = async () => {
    setToggling(true);
    setError(null);
    try {
      const p = await api.setOnline(!online);
      profile.setData(p);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setToggling(false);
    }
  };

  const refresh = async () => {
    await Promise.all([profile.pull(), active.pull(), earnings.pull(), online ? offers.pull() : Promise.resolve()]);
  };

  const first = user?.name.split(" ")[0] ?? "";
  const live = (offers.data ?? []).filter((j) => +new Date(j.expiresAt) > Date.now());

  return (
    <Screen
      header={<Header title="GEKEL" subtitle={profile.data ? `${online ? "Online" : "Offline"} · ${profile.data.plate}` : "Rider"} left={<Logo size={34} />} />}
      refreshing={profile.refreshing}
      onRefresh={refresh}
    >
      <QueryBoundary loading={profile.loading} error={profile.error} onRetry={profile.refetch}>
        {error ? <Banner tone="danger">{error}</Banner> : null}

        <View className="rounded-2xl bg-brand-500 p-5">
          <Text className="text-[13px] font-semibold text-white-85">Hello, {first}</Text>
          <Text className="mt-3 text-[12px] font-semibold uppercase tracking-wider text-white-75">Today's earnings</Text>
          <Text className="text-[34px] font-extrabold text-white">{earnings.data ? money(earnings.data.todayTotal) : "—"}</Text>
          <View className="mt-3 flex-row" style={{ gap: 20 }}>
            <Meta label="Trips" value={earnings.data ? String(earnings.data.todayTrips) : "—"} />
            <Meta label="Distance" value={earnings.data ? `${earnings.data.todayDistanceKm.toFixed(1)} km` : "—"} />
            <Meta label="Rating" value={profile.data ? profile.data.rating.toFixed(1) : "—"} />
          </View>
        </View>

        {active.data ? (
          <Pressable
            onPress={() => {
              const r = routeForStage(active.data!);
              nav.navigate(r.name, r.params);
            }}
            accessibilityRole="button"
            className="mt-3 flex-row items-center rounded-2xl bg-ink p-4 active:bg-surface-soft"
          >
            <View className="h-10 w-10 items-center justify-center rounded-full bg-brand-500"><MapPin size={20} color={c.white} /></View>
            <View className="ml-3 flex-1">
              <Text className="text-[12px] font-semibold uppercase tracking-wider text-sink-soft">Active delivery · {active.data.orderCode}</Text>
              <Text className="text-[16px] font-bold text-white" numberOfLines={1}>{active.data.stage === "to_pickup" ? `Pick up at ${active.data.pickup.name}` : `Deliver to ${active.data.dropoff.area}`}</Text>
            </View>
            <ChevronRight size={20} color={c.white} />
          </Pressable>
        ) : (
          <Pressable
            onPress={toggle}
            disabled={toggling}
            accessibilityRole="switch"
            accessibilityState={{ checked: online }}
            accessibilityLabel={online ? "Go offline" : "Go online"}
            className="mt-3 items-center rounded-2xl border border-line bg-white py-6"
          >
            <View className={`h-24 w-24 items-center justify-center rounded-full ${online ? "bg-success" : "bg-sink"}`}>
              {toggling ? <ActivityIndicator color={online ? c.white : c.ink} /> : <Power size={40} color={online ? c.white : c.inkSoft} />}
            </View>
            <Text className="mt-3 text-[18px] font-extrabold text-ink">{online ? "You're online" : "You're offline"}</Text>
            <Text className="mt-0.5 px-6 text-center text-[13px] text-ink-soft">{online ? `Scanning ${profile.data?.zone ?? "your zone"} for jobs. Tap to go offline.` : "Tap to go online and start receiving jobs."}</Text>
          </Pressable>
        )}

        {online && !active.data ? (
          <>
            <SectionTitle title="Nearby jobs" />
            {offers.loading ? (
              <Card className="items-center py-8"><ActivityIndicator color={c.brand} /></Card>
            ) : offers.error ? (
              <Banner tone="danger">{offers.error}</Banner>
            ) : live.length === 0 ? (
              <Card><Empty icon={RadarIcon} title="Looking for jobs" body="Stay close to Eastleigh and Kamukunji. New jobs appear here the moment a parcel is ready." /></Card>
            ) : (
              live.map((j) => <OfferCard key={j.id} job={j} onPress={() => nav.navigate("JobOffer", { id: j.id })} />)
            )}
          </>
        ) : null}
      </QueryBoundary>
    </Screen>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <View>
      <Text className="text-[11px] font-semibold uppercase tracking-wider text-white-75">{label}</Text>
      <Text className="text-[16px] font-bold text-white">{value}</Text>
    </View>
  );
}

function OfferCard({ job: j, onPress }: { job: Job; onPress: () => void }) {
  return (
    <Card className="mb-3" onPress={onPress}>
      <View className="flex-row items-start justify-between">
        <View>
          <Text className="text-[12px] font-semibold uppercase tracking-wider text-ink-soft">Payout</Text>
          <Text className="text-[26px] font-extrabold text-ink">{money(j.payout)}</Text>
        </View>
        <Pill label={`${countdown(j.expiresAt)}`} tone="brand" />
      </View>
      <View className="mt-3">
        <Text className="text-[14px] text-ink"><Text className="font-bold">{j.pickup.name}</Text> · {j.pickup.area}</Text>
        <Text className="mt-0.5 text-[14px] text-ink-soft">to {j.dropoff.area}</Text>
        <Text className="mt-1 text-[13px] text-ink-mute">{j.distanceKm.toFixed(1)} km · about {j.etaMins} min{j.fragile ? " · Fragile" : ""}</Text>
      </View>
    </Card>
  );
}
