import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ChevronRight, MessageCircle, Package, Plus, ShieldCheck, Store, User } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";
import { Logo } from "../../components/Logo";
import { Card, Empty, Header, IconButton, Pill, QueryBoundary, Screen, SectionTitle } from "../../components/ui";
import { useQuery } from "../../hooks/useQuery";
import { api } from "../../lib/api";
import { countdown, money } from "../../lib/format";
import { useTick } from "../../hooks/useTick";
import type { SupplierStackParams } from "../../navigation/types";
import { c } from "../../theme/tokens";
import { Button } from "../../components/ui";

type Nav = NativeStackNavigationProp<SupplierStackParams>;

export function SupplierHome() {
  const nav = useNavigation<Nav>();
  useTick(30_000);
  const profile = useQuery(() => api.getSupplierProfile(), []);
  const summary = useQuery(() => api.getSupplierSummary(), [], { refreshMs: 30_000 });
  const rfqs = useQuery(() => api.listRfqs(), [], { refreshMs: 30_000 });

  const s = summary.data;
  const open = (rfqs.data ?? []).filter((r) => r.status === "open").slice(0, 3);
  const refresh = async () => {
    await Promise.all([profile.pull(), summary.pull(), rfqs.pull()]);
  };

  return (
    <Screen
      header={
        <Header
          title="GEKEL"
          left={<Logo size={34} />}
          right={<IconButton icon={User} label="Profile" onPress={() => nav.navigate("Profile")} />}
          subtitle="Seller"
        />
      }
      refreshing={summary.refreshing}
      onRefresh={refresh}
    >
      <QueryBoundary loading={summary.loading && profile.loading} error={summary.error ?? profile.error} onRetry={() => { void summary.refetch(); void profile.refetch(); }}>
        {profile.data ? (
          <Card className="flex-row items-center">
            <View className="h-12 w-12 items-center justify-center rounded-xl bg-brand-50">
              <Store size={24} color={c.brand600} />
            </View>
            <View className="ml-3 flex-1">
              <View className="flex-row items-center">
                <Text className="text-[17px] font-bold text-ink" numberOfLines={1}>{profile.data.shopName}</Text>
                {profile.data.verified ? <ShieldCheck size={16} color={c.success} style={{ marginLeft: 6 }} /> : null}
              </View>
              <Text className="text-[13px] text-ink-soft" numberOfLines={1}>{profile.data.stall}</Text>
            </View>
            {profile.data.verified ? <Pill label="Verified" tone="success" /> : <Pill label="Pending review" tone="neutral" />}
          </Card>
        ) : null}

        {s ? (
          <>
            <View className="mt-3 flex-row" style={{ gap: 10 }}>
              <Stat label="New requests" value={String(s.newRequests)} onPress={() => nav.navigate("Tabs", { screen: "Requests" })} accent={s.newRequests > 0} />
              <Stat label="In progress" value={String(s.ordersInProgress)} onPress={() => nav.navigate("Tabs", { screen: "Orders" })} />
              <Stat label="Today" value={money(s.todaySales).replace("KSh ", "")} prefix="KSh" />
            </View>

            <SectionTitle title="Orders" />
            <Card className="py-1">
              <StatusRow label="Confirm payment" count={s.toConfirm} onPress={() => nav.navigate("Tabs", { screen: "Orders", params: { group: "confirm" } })} />
              <StatusRow label="Pack & upload proof" count={s.toPack} onPress={() => nav.navigate("Tabs", { screen: "Orders", params: { group: "pack" } })} />
              <StatusRow label="Ready for rider pickup" count={s.readyForPickup} onPress={() => nav.navigate("Tabs", { screen: "Orders", params: { group: "handoff" } })} />
              <StatusRow label="Completed today" count={s.completedToday} last onPress={() => nav.navigate("Tabs", { screen: "Orders", params: { group: "done" } })} />
            </Card>

            <Text className="mt-3 text-center text-[13px] text-ink-soft">
              This week: <Text className="font-bold text-ink">{s.weekOrders} orders</Text> · <Text className="font-bold text-ink">{money(s.weekSales)}</Text>
            </Text>
          </>
        ) : null}

        <SectionTitle title="Buyer requests" action="See all" onAction={() => nav.navigate("Tabs", { screen: "Requests" })} />
        {rfqs.loading ? null : open.length === 0 ? (
          <Card>
            <Empty title="No open requests" body="New buyer requests from Eastleigh and Kamukunji will show up here." icon={MessageCircle} />
          </Card>
        ) : (
          open.map((r) => (
            <Card key={r.id} className="mb-2" onPress={() => nav.navigate("RfqDetail", { id: r.id })}>
              <View className="flex-row items-start justify-between">
                <View className="flex-1 pr-3">
                  <Text className="text-[16px] font-bold text-ink" numberOfLines={1}>{r.title}</Text>
                  <Text className="mt-0.5 text-[13px] text-ink-soft">{r.qty} {r.unit} · {r.buyerArea}{r.budget ? ` · Budget ${money(r.budget)}` : ""}</Text>
                </View>
                <Text className="text-[12px] font-semibold text-brand-700">{countdown(r.expiresAt)} left</Text>
              </View>
              <View className="mt-3 flex-row items-center justify-between">
                <Text className="text-[13px] font-semibold text-brand-600">Send a quote</Text>
                <ChevronRight size={18} color={c.brand600} />
              </View>
            </Card>
          ))
        )}

        <View className="mt-4" style={{ gap: 10 }}>
          <Button label="Add a product" icon={Plus} onPress={() => nav.navigate("ProductForm", {})} />
          <Button label="Import my catalogue" icon={Package} variant="outline" onPress={() => nav.navigate("CatalogueImport")} />
        </View>
      </QueryBoundary>
    </Screen>
  );
}

function Stat({ label, value, prefix, onPress, accent }: { label: string; value: string; prefix?: string; onPress?: () => void; accent?: boolean }) {
  return (
    <Pressable onPress={onPress} disabled={!onPress} className="flex-1 rounded-2xl border border-line bg-white p-3 active:bg-cream">
      {prefix ? <Text className="text-[11px] font-semibold text-ink-mute">{prefix}</Text> : <View style={{ height: 14 }} />}
      <Text className={`text-[24px] font-extrabold ${accent ? "text-brand-600" : "text-ink"}`} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
      <Text className="mt-0.5 text-[12px] text-ink-soft">{label}</Text>
    </Pressable>
  );
}

function StatusRow({ label, count, onPress, last }: { label: string; count: number; onPress: () => void; last?: boolean }) {
  return (
    <Pressable onPress={onPress} className={`flex-row items-center py-3.5 ${last ? "" : "border-b border-line"}`}>
      <Text className="flex-1 text-[15px] font-medium text-ink">{label}</Text>
      <View className={`mr-2 min-w-[28px] items-center rounded-full px-2 py-0.5 ${count > 0 ? "bg-brand-50" : "bg-sink"}`}>
        <Text className={`text-[13px] font-bold ${count > 0 ? "text-brand-700" : "text-ink-mute"}`}>{count}</Text>
      </View>
      <ChevronRight size={18} color={c.inkMute} />
    </Pressable>
  );
}
