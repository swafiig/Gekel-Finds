import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Clock, MessageSquareQuote } from "lucide-react-native";
import { useMemo, useState } from "react";
import { Text, View } from "react-native";
import { Card, Chips, Empty, Header, Pill, QueryBoundary, Screen, Thumb } from "../../components/ui";
import { useTick } from "../../hooks/useTick";
import { useQuery } from "../../hooks/useQuery";
import { api, Rfq } from "../../lib/api";
import { countdown, money } from "../../lib/format";
import type { SupplierStackParams } from "../../navigation/types";
import { c } from "../../theme/tokens";

type Nav = NativeStackNavigationProp<SupplierStackParams>;
type F = "open" | "quoted" | "closed";

export function Requests() {
  const nav = useNavigation<Nav>();
  useTick(1000);
  const q = useQuery(() => api.listRfqs(), [], { refreshMs: 20_000 });
  const [f, setF] = useState<F>("open");

  const groups = useMemo(() => {
    const all = q.data ?? [];
    return {
      open: all.filter((r) => r.status === "open"),
      quoted: all.filter((r) => r.status === "quoted"),
      closed: all.filter((r) => ["accepted", "declined", "expired"].includes(r.status)),
    };
  }, [q.data]);

  return (
    <Screen header={<Header title="Buyer requests" subtitle="Quote fast. First good offers win." />} refreshing={q.refreshing} onRefresh={q.pull}>
      <Chips
        value={f}
        onChange={setF}
        options={[
          { key: "open", label: "Open" },
          { key: "quoted", label: "Quoted" },
          { key: "closed", label: "Closed" },
        ]}
        counts={{ open: groups.open.length, quoted: groups.quoted.length, closed: groups.closed.length }}
      />
      <QueryBoundary loading={q.loading} error={q.error} onRetry={q.refetch}>
        {groups[f].length === 0 ? (
          <Empty
            icon={MessageSquareQuote}
            title={f === "open" ? "No open requests" : f === "quoted" ? "No quotes waiting" : "Nothing closed yet"}
            body={f === "open" ? "Pull down to refresh. New requests appear here as buyers post them." : undefined}
          />
        ) : (
          groups[f].map((r) => <RfqCard key={r.id} rfq={r} onPress={() => nav.navigate("RfqDetail", { id: r.id })} />)
        )}
      </QueryBoundary>
    </Screen>
  );
}

function RfqCard({ rfq: r, onPress }: { rfq: Rfq; onPress: () => void }) {
  const live = r.status === "open" || r.status === "quoted";
  return (
    <Card className="mb-3" onPress={onPress}>
      <View className="flex-row">
        <Thumb uri={r.photoUri} size={64} />
        <View className="ml-3 flex-1">
          <View className="flex-row items-start justify-between">
            <Text className="flex-1 pr-2 text-[16px] font-bold text-ink" numberOfLines={2}>{r.title}</Text>
          </View>
          <Text className="mt-0.5 text-[13px] text-ink-soft">{r.qty} {r.unit} · {r.buyerName} · {r.buyerArea}</Text>
          {r.budget ? <Text className="mt-0.5 text-[13px] text-ink-soft">Budget <Text className="font-bold text-ink">{money(r.budget)}</Text></Text> : null}
        </View>
      </View>
      <View className="mt-3 flex-row items-center justify-between">
        {r.status === "quoted" && r.quote ? <Pill label={`Quoted ${money(r.quote.price)}`} tone="brand" /> : r.status === "open" ? <Pill label="New" tone="success" /> : <Pill label={r.status} />}
        {live ? (
          <View className="flex-row items-center">
            <Clock size={13} color={c.inkSoft} />
            <Text className="ml-1 text-[12px] font-semibold text-ink-soft">{countdown(r.expiresAt)} left</Text>
          </View>
        ) : null}
      </View>
    </Card>
  );
}
