import { Wallet } from "lucide-react-native";
import { Text, View } from "react-native";
import { Card, Empty, Header, QueryBoundary, Screen, SectionTitle } from "../../components/ui";
import { useQuery } from "../../hooks/useQuery";
import { api } from "../../lib/api";
import { clock, money } from "../../lib/format";

export function Earnings() {
  const q = useQuery(() => api.getEarnings(), [], { refreshMs: 30_000 });
  const e = q.data;
  return (
    <Screen header={<Header title="Earnings" subtitle="Paid by GEKEL for each completed delivery" />} refreshing={q.refreshing} onRefresh={q.pull}>
      <QueryBoundary loading={q.loading} error={q.error} onRetry={q.refetch}>
        {e ? (
          <>
            <View className="rounded-2xl bg-brand-500 p-5">
              <Text className="text-[12px] font-semibold uppercase tracking-wider text-white-75">Today</Text>
              <Text className="text-[36px] font-extrabold text-white">{money(e.todayTotal)}</Text>
              <Text className="text-[13px] text-white-85">{e.todayTrips} deliveries · {e.todayDistanceKm.toFixed(1)} km</Text>
            </View>
            <Card className="mt-3 flex-row items-center justify-between">
              <View>
                <Text className="text-[12px] font-semibold uppercase tracking-wider text-ink-soft">This week</Text>
                <Text className="text-[22px] font-extrabold text-ink">{money(e.weekTotal)}</Text>
              </View>
              <Text className="text-[14px] text-ink-soft">{e.weekTrips} deliveries</Text>
            </Card>

            <SectionTitle title="Today's deliveries" />
            {e.recent.length === 0 ? (
              <Card><Empty icon={Wallet} title="No earnings yet today" body="Completed deliveries will be listed here." /></Card>
            ) : (
              e.recent.map((r) => (
                <Card key={r.id} className="mb-2 flex-row items-center justify-between">
                  <View className="flex-1 pr-3">
                    <Text className="text-[15px] font-bold text-ink">{r.orderCode} · {r.area}</Text>
                    <Text className="text-[13px] text-ink-soft">{clock(r.at)}{r.tip > 0 ? ` · includes ${money(r.tip)} tip` : ""}</Text>
                  </View>
                  <Text className="text-[16px] font-extrabold text-ink">{money(r.amount + r.tip)}</Text>
                </Card>
              ))
            )}
          </>
        ) : null}
      </QueryBoundary>
    </Screen>
  );
}
