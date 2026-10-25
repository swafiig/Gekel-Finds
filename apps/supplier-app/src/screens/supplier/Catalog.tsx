import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { PackageOpen, Plus, Search } from "lucide-react-native";
import { useMemo, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { Button, Card, Chips, Empty, Header, IconButton, Pill, QueryBoundary, Screen, Thumb } from "../../components/ui";
import { useQuery } from "../../hooks/useQuery";
import { api, Product } from "../../lib/api";
import { money } from "../../lib/format";
import type { SupplierStackParams } from "../../navigation/types";
import { c } from "../../theme/tokens";

type Nav = NativeStackNavigationProp<SupplierStackParams>;
type F = "all" | "wholesale" | "low" | "out";
const LOW = 5;

export function Catalog() {
  const nav = useNavigation<Nav>();
  const q = useQuery(() => api.listProducts(), []);
  const [f, setF] = useState<F>("all");
  const [term, setTerm] = useState("");

  const list = useMemo(() => {
    const t = term.trim().toLowerCase();
    return (q.data ?? []).filter((p) => {
      if (t && !`${p.name} ${p.sku}`.toLowerCase().includes(t)) return false;
      if (f === "wholesale") return p.tiers.length > 0;
      if (f === "low") return p.stock > 0 && p.stock <= LOW;
      if (f === "out") return p.stock === 0;
      return true;
    });
  }, [q.data, f, term]);

  const all = q.data ?? [];
  return (
    <Screen
      header={<Header title="Catalogue" subtitle={q.data ? `${all.length} products` : undefined} right={<IconButton icon={Plus} label="Add product" onPress={() => nav.navigate("ProductForm", {})} />} />}
      refreshing={q.refreshing}
      onRefresh={q.pull}
    >
      <View className="mb-3 h-12 flex-row items-center rounded-xl border border-line bg-white px-3">
        <Search size={18} color={c.inkMute} />
        <TextInput value={term} onChangeText={setTerm} placeholder="Search by name or SKU" placeholderTextColor={c.inkMute} className="ml-2 h-full flex-1 text-[16px] text-ink" returnKeyType="search" />
      </View>
      <Chips
        value={f}
        onChange={setF}
        options={[
          { key: "all", label: "All" },
          { key: "wholesale", label: "Wholesale" },
          { key: "low", label: "Low stock" },
          { key: "out", label: "Out of stock" },
        ]}
        counts={{ low: all.filter((p) => p.stock > 0 && p.stock <= LOW).length, out: all.filter((p) => p.stock === 0).length }}
      />
      <QueryBoundary loading={q.loading} error={q.error} onRetry={q.refetch}>
        {list.length === 0 ? (
          all.length === 0 ? (
            <Empty icon={PackageOpen} title="No products yet" body="Add your first product so buyers can find it." action={<Button label="Add product" icon={Plus} onPress={() => nav.navigate("ProductForm", {})} />} />
          ) : (
            <Empty icon={Search} title="No matches" body="Try a different search or filter." />
          )
        ) : (
          list.map((p) => <ProductRow key={p.id} p={p} onPress={() => nav.navigate("ProductForm", { id: p.id })} />)
        )}
      </QueryBoundary>
    </Screen>
  );
}

function ProductRow({ p, onPress }: { p: Product; onPress: () => void }) {
  const out = p.stock === 0;
  const low = !out && p.stock <= LOW;
  return (
    <Pressable onPress={onPress} accessibilityRole="button" className="mb-3 flex-row rounded-2xl border border-line bg-white p-3 active:bg-cream">
      <Thumb uri={p.photoUri} size={72} />
      <View className="ml-3 flex-1">
        <Text className="text-[16px] font-bold text-ink" numberOfLines={2}>{p.name}</Text>
        <Text className="mt-0.5 text-[17px] font-extrabold text-brand-600">{money(p.price)}</Text>
        <View className="mt-1.5 flex-row items-center justify-between">
          <Pill label={out ? "Out of stock" : low ? `Low: ${p.stock}` : `In stock: ${p.stock}`} tone={out ? "danger" : low ? "brand" : "success"} />
          <Text className="text-[12px] text-ink-mute">{p.sku}</Text>
        </View>
        {p.tiers.length > 0 ? <Text className="mt-1 text-[12px] text-ink-soft">Wholesale from {p.tiers[0].minQty} pcs at {money(p.tiers[0].price)}</Text> : null}
      </View>
    </Pressable>
  );
}
