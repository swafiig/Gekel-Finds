import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ClipboardList } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import { Text, View } from "react-native";
import { Card, Chips, Empty, Header, Pill, QueryBoundary, Screen, Thumb } from "../../components/ui";
import { useQuery } from "../../hooks/useQuery";
import { api, Order } from "../../lib/api";
import { money, timeAgo } from "../../lib/format";
import { GROUPS, groupOf, nextAction, OrderGroup, STATUS_LABEL } from "../../lib/orderStatus";
import type { SupplierStackParams, SupplierTabParams } from "../../navigation/types";

type Nav = NativeStackNavigationProp<SupplierStackParams>;

export function Orders() {
  const nav = useNavigation<Nav>();
  const route = useRoute<RouteProp<SupplierTabParams, "Orders">>();
  const q = useQuery(() => api.listOrders(), [], { refreshMs: 20_000 });
  const [g, setG] = useState<OrderGroup>(route.params?.group ?? "confirm");

  // Home's status rows deep-link into a group.
  useEffect(() => {
    if (route.params?.group) setG(route.params.group);
  }, [route.params?.group]);

  const byGroup = useMemo(() => {
    const m: Record<OrderGroup, Order[]> = { confirm: [], pack: [], handoff: [], done: [] };
    (q.data ?? []).forEach((o) => m[groupOf(o.status)].push(o));
    return m;
  }, [q.data]);

  return (
    <Screen header={<Header title="Orders" subtitle="Confirm payment, pack, hand over" />} refreshing={q.refreshing} onRefresh={q.pull}>
      <Chips value={g} onChange={setG} options={GROUPS} counts={{ confirm: byGroup.confirm.length, pack: byGroup.pack.length, handoff: byGroup.handoff.length }} />
      <QueryBoundary loading={q.loading} error={q.error} onRetry={q.refetch}>
        {byGroup[g].length === 0 ? (
          <Empty icon={ClipboardList} title="Nothing here" body={g === "confirm" ? "Orders waiting on payment will show up here." : undefined} />
        ) : (
          byGroup[g].map((o) => <OrderCard key={o.id} o={o} onPress={() => nav.navigate("OrderDetail", { id: o.id })} />)
        )}
      </QueryBoundary>
    </Screen>
  );
}

function OrderCard({ o, onPress }: { o: Order; onPress: () => void }) {
  const st = STATUS_LABEL[o.status];
  const act = nextAction(o);
  const first = o.items[0];
  const more = o.items.length - 1;
  return (
    <Card className="mb-3" onPress={onPress}>
      <View className="flex-row items-center justify-between">
        <Text className="text-[16px] font-extrabold text-ink">{o.code}</Text>
        <Pill label={st.label} tone={st.tone} />
      </View>
      <View className="mt-3 flex-row">
        <Thumb uri={first?.photoUri} size={52} />
        <View className="ml-3 flex-1">
          <Text className="text-[15px] font-semibold text-ink" numberOfLines={1}>
            {first ? `${first.qty}× ${first.name}` : "Order"}{more > 0 ? ` +${more} more` : ""}
          </Text>
          <Text className="mt-0.5 text-[13px] text-ink-soft">{o.buyerName} · {o.buyerArea} · {timeAgo(o.createdAt)}</Text>
          <Text className="mt-0.5 text-[15px] font-bold text-ink">{money(o.itemsTotal)}</Text>
        </View>
      </View>
      {act ? <Text className="mt-3 text-[13px] font-medium text-brand-700">{act}</Text> : null}
    </Card>
  );
}
