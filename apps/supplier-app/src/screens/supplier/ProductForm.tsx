import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Minus, Plus, Trash2 } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { PhotoField } from "../../components/PhotoField";
import { Banner, Button, Chips, Field, Header, QueryBoundary, Screen } from "../../components/ui";
import { useQuery } from "../../hooks/useQuery";
import { api, PriceTier } from "../../lib/api";
import { money } from "../../lib/format";
import type { SupplierStackParams } from "../../navigation/types";
import { c } from "../../theme/tokens";

type Props = NativeStackScreenProps<SupplierStackParams, "ProductForm">;
const CATEGORIES = ["Fashion & Bags", "Footwear", "Apparel", "Electronics", "Home & Kitchen", "Beauty", "Other"];
const digits = (s: string) => s.replace(/[^\d]/g, "");

export function ProductForm({ route, navigation }: Props) {
  const id = route.params.id;
  const existing = useQuery(async () => (id ? (await api.listProducts()).find((p) => p.id === id) ?? null : null), [id]);

  const [photo, setPhoto] = useState<string | undefined>();
  const [name, setName] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [sku, setSku] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("1");
  const [tiers, setTiers] = useState<Array<{ minQty: string; price: string }>>([]);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    const p = existing.data;
    if (!p) return;
    setPhoto(p.photoUri);
    setName(p.name);
    setCategory(p.category);
    setSku(p.sku);
    setPrice(String(p.price));
    setStock(String(p.stock));
    setTiers(p.tiers.map((t) => ({ minQty: String(t.minQty), price: String(t.price) })));
  }, [existing.data]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!photo) e.photo = "A clear product photo is required.";
    if (!name.trim()) e.name = "Enter the product name.";
    const p = Number(price);
    if (!(p > 0)) e.price = "Enter a price above zero.";
    if (stock === "" || Number(stock) < 0) e.stock = "Enter how many you have (0 if none).";
    const parsed: PriceTier[] = [];
    tiers.forEach((t, i) => {
      const mq = Number(t.minQty);
      const tp = Number(t.price);
      if (!(mq >= 2) || !(tp > 0)) e[`tier${i}`] = "Enter a quantity of 2 or more and a price.";
      else if (tp >= p) e[`tier${i}`] = "Wholesale price should be lower than the retail price.";
      else parsed.push({ minQty: mq, price: tp });
    });
    const qtys = parsed.map((t) => t.minQty);
    if (new Set(qtys).size !== qtys.length) e.tiers = "Each wholesale tier needs a different quantity.";
    setErrors(e);
    return { ok: Object.keys(e).length === 0, parsed };
  };

  const save = async () => {
    const { ok, parsed } = validate();
    if (!ok) return;
    setBusy(true);
    setFormError(null);
    try {
      await api.saveProduct(id ?? null, {
        name: name.trim(),
        category,
        sku: sku.trim() || name.trim().slice(0, 2).toUpperCase() + "-" + Math.floor(100 + Math.random() * 900),
        price: Number(price),
        stock: Number(stock),
        photoUri: photo,
        tiers: parsed.sort((a, b) => a.minQty - b.minQty),
      });
      navigation.goBack();
    } catch (e: any) {
      setFormError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = () =>
    Alert.alert("Delete this product?", "Buyers will no longer see it. This can't be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await api.deleteProduct(id!);
            navigation.goBack();
          } catch (e: any) {
            setFormError(e.message);
          }
        },
      },
    ]);

  const bump = (d: number) => setStock(String(Math.max(0, (Number(stock) || 0) + d)));

  return (
    <Screen keyboard header={<Header title={id ? "Edit product" : "Add product"} onBack={() => navigation.goBack()} />} footer={<Button label={id ? "Save changes" : "Save product"} onPress={save} loading={busy} />}>
      <QueryBoundary loading={!!id && existing.loading} error={existing.error} onRetry={existing.refetch}>
        {formError ? <Banner tone="danger">{formError}</Banner> : null}
        <PhotoField label="Product photo" value={photo} onChange={(u) => { setPhoto(u); setErrors((e) => ({ ...e, photo: "" })); }} error={errors.photo} hint="Natural light, plain background. Buyers decide from this photo." aspect={1.4} />
        <Field label="Product name" value={name} onChangeText={setName} placeholder="e.g. Brown Leather Handbag" error={errors.name} autoCapitalize="words" />

        <Text className="mb-1.5 text-[13px] font-semibold text-ink">Category</Text>
        <Chips value={category} onChange={setCategory} options={CATEGORIES.map((k) => ({ key: k, label: k }))} />

        <View className="flex-row" style={{ gap: 12 }}>
          <Field className="flex-1" label="Retail price" prefix="KSh" keyboardType="number-pad" value={price} onChangeText={(t) => setPrice(digits(t))} error={errors.price} placeholder="0" />
          <Field className="flex-1" label="SKU (optional)" value={sku} onChangeText={setSku} autoCapitalize="characters" placeholder="HB-841" />
        </View>

        <Text className="mb-1.5 text-[13px] font-semibold text-ink">In stock</Text>
        <View className="mb-1 flex-row items-center" style={{ gap: 10 }}>
          <Pressable onPress={() => bump(-1)} accessibilityLabel="Decrease stock" className="h-12 w-12 items-center justify-center rounded-xl border border-line bg-white active:bg-cream"><Minus size={18} color={c.ink} /></Pressable>
          <Field className="mb-0 flex-1" value={stock} onChangeText={(t) => setStock(digits(t))} keyboardType="number-pad" suffix="units" accessibilityLabel="Units in stock" />
          <Pressable onPress={() => bump(1)} accessibilityLabel="Increase stock" className="h-12 w-12 items-center justify-center rounded-xl border border-line bg-white active:bg-cream"><Plus size={18} color={c.ink} /></Pressable>
        </View>
        {errors.stock ? <Text className="mb-3 text-[12px] text-danger">{errors.stock}</Text> : <View className="mb-3" />}

        <View className="mb-2 flex-row items-center justify-between">
          <View className="flex-1 pr-3">
            <Text className="text-[13px] font-semibold text-ink">Wholesale tiers</Text>
            <Text className="text-[12px] text-ink-soft">Lower price per piece when buyers order more.</Text>
          </View>
          <Button label="Add tier" icon={Plus} variant="outline" small onPress={() => setTiers((t) => [...t, { minQty: "", price: "" }])} />
        </View>
        {errors.tiers ? <Text className="mb-2 text-[12px] text-danger">{errors.tiers}</Text> : null}
        {tiers.map((t, i) => (
          <View key={i} className="mb-2">
            <View className="flex-row items-center" style={{ gap: 8 }}>
              <Field className="mb-0 flex-1" value={t.minQty} onChangeText={(v) => setTiers((a) => a.map((x, j) => (j === i ? { ...x, minQty: digits(v) } : x)))} keyboardType="number-pad" suffix="+ pcs" placeholder="10" accessibilityLabel={`Tier ${i + 1} minimum quantity`} />
              <Field className="mb-0 flex-1" value={t.price} onChangeText={(v) => setTiers((a) => a.map((x, j) => (j === i ? { ...x, price: digits(v) } : x)))} keyboardType="number-pad" prefix="KSh" placeholder="0" accessibilityLabel={`Tier ${i + 1} price`} />
              <Pressable onPress={() => setTiers((a) => a.filter((_, j) => j !== i))} accessibilityLabel="Remove tier" hitSlop={8} className="h-12 w-10 items-center justify-center"><Trash2 size={18} color={c.danger} /></Pressable>
            </View>
            {errors[`tier${i}`] ? <Text className="mt-1 text-[12px] text-danger">{errors[`tier${i}`]}</Text> : Number(t.price) > 0 && Number(price) > 0 && Number(t.price) < Number(price) ? <Text className="mt-1 text-[12px] text-ink-soft">{Math.round((1 - Number(t.price) / Number(price)) * 100)}% below retail ({money(Number(price))})</Text> : null}
          </View>
        ))}

        {id ? <View className="mt-6"><Button label="Delete product" variant="danger" small icon={Trash2} onPress={remove} /></View> : null}
      </QueryBoundary>
    </Screen>
  );
}
