import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Bike, ChevronRight } from "lucide-react-native";
import { Text, View } from "react-native";
import { Card, Empty, Header, Pill, QueryBoundary, Screen, SectionTitle } from "../../components/ui";
import { useQuery } from "../../hooks/useQuery";
import { api, Delivery, DeliveryStage } from "../../lib/api";
import { clock, money } from "../../lib/format";
import { routeForStage } from "../../lib/riderFlow";
import type { RiderStackParams } from "../../navigation/types";
import { c } from "../../theme/tokens";

type Nav = NativeStackNavigationProp<RiderStackParams>;
const STAGE: Record<DeliveryStage, string> = { to_pickup: "Heading to pickup", picked_up: "Picked up", in_transit: "On the way", arrived: "At drop-off", delivered: "Delivered" };

export function Deliveries() {
  const nav = useNavigation<Nav>();
  const q = useQuery(() => api.listDeliveries(), [], { refreshMs: 15_000 });
  const list = q.data ?? [];
  const active = list.filter((d) => d.stage !== "delivered");
  const done = list.filter((d) => d.stage === "delivered");

  return (
    <Screen header={<Header title="Deliveries" subtitle="Today's jobs" />} refreshing={q.refreshing} onRefresh={q.pull}>
      <QueryBoundary loading={q.loading} error={q.error} onRetry={q.refetch}>
        {list.length === 0 ? (
          <Empty icon={Bike} title="No deliveries yet" body="Go online from Radar to start receiving jobs." />
        ) : (
          <>
            {active.length > 0 ? <SectionTitle title="In progress" /> : null}
            {active.map((d) => (
              <Card key={d.id} className="mb-3" onPress={() => { const r = routeForStage(d); nav.navigate(r.name, r.params); }}>
                <View className="flex-row items-center justify-between">
                  <Text className="text-[16px] font-extrabold text-ink">{d.orderCode}</Text>
                  <Pill label={STAGE[d.stage]} tone="brand" />
                </View>
                <Text className="mt-2 text-[14px] text-ink-soft">{d.pickup.name} → {d.dropoff.area}</Text>
                <View className="mt-2 flex-row items-center justify-between">
                  <Text className="text-[15px] font-bold text-ink">{money(d.payout)}</Text>
                  <ChevronRight size={18} color={c.inkMute} />
                </View>
              </Card>
            ))}
            {done.length > 0 ? <SectionTitle title="Completed" /> : null}
            {done.map((d) => <DoneRow key={d.id} d={d} />)}
          </>
        )}
      </QueryBoundary>
    </Screen>
  );
}

function DoneRow({ d }: { d: Delivery }) {
  return (
    <Card className="mb-2 flex-row items-center justify-between">
      <View className="flex-1 pr-3">
        <Text className="text-[15px] font-bold text-ink">{d.orderCode} · {d.dropoff.area}</Text>
        <Text className="text-[13px] text-ink-soft">{d.deliveredAt ? clock(d.deliveredAt) : ""} · {d.distanceKm.toFixed(1)} km</Text>
      </View>
      <Text className="text-[16px] font-extrabold text-success">{money(d.payout)}</Text>
    </Card>
  );
}
