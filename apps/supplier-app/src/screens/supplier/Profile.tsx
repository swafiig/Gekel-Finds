import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { HelpCircle, LogOut, ShieldCheck } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Alert, Linking, Text, View } from "react-native";
import { Banner, Button, Card, Field, Header, Pill, QueryBoundary, Screen } from "../../components/ui";
import { useQuery } from "../../hooks/useQuery";
import { api } from "../../lib/api";
import { useAuth } from "../../store/auth";
import type { SupplierStackParams } from "../../navigation/types";
import { c } from "../../theme/tokens";

type Props = NativeStackScreenProps<SupplierStackParams, "Profile">;

export function SupplierProfile({ navigation }: Props) {
  const user = useAuth((s) => s.user);
  const signOut = useAuth((s) => s.signOut);
  const q = useQuery(() => api.getSupplierProfile(), []);
  const [shopName, setShopName] = useState("");
  const [stall, setStall] = useState("");
  const [till, setTill] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ tone: "danger" | "success"; text: string } | null>(null);

  useEffect(() => {
    if (q.data) {
      setShopName(q.data.shopName);
      setStall(q.data.stall);
      setTill(q.data.tillNumber);
    }
  }, [q.data]);

  const dirty = !!q.data && (shopName !== q.data.shopName || stall !== q.data.stall || till !== q.data.tillNumber);

  const save = async () => {
    if (!/^\d{5,7}$/.test(till)) return setMsg({ tone: "danger", text: "Till or Paybill must be 5 to 7 digits." });
    if (!shopName.trim()) return setMsg({ tone: "danger", text: "Enter your shop name." });
    setBusy(true);
    setMsg(null);
    try {
      const p = await api.updateSupplierProfile({ shopName: shopName.trim(), stall: stall.trim(), tillNumber: till });
      q.setData(p);
      setMsg({ tone: "success", text: "Saved." });
    } catch (e: any) {
      setMsg({ tone: "danger", text: e.message });
    } finally {
      setBusy(false);
    }
  };

  const logout = () =>
    Alert.alert("Sign out?", "You'll need a new SMS code to sign in again.", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign out", style: "destructive", onPress: () => void signOut() },
    ]);

  return (
    <Screen keyboard header={<Header title="Profile" onBack={() => navigation.goBack()} />} footer={dirty ? <Button label="Save changes" onPress={save} loading={busy} /> : undefined}>
      <QueryBoundary loading={q.loading} error={q.error} onRetry={q.refetch}>
        {msg ? <Banner tone={msg.tone}>{msg.text}</Banner> : null}
        <Card className="mb-4 flex-row items-center justify-between">
          <View>
            <Text className="text-[17px] font-bold text-ink">{user?.name}</Text>
            <Text className="text-[13px] text-ink-soft">{user?.phone}</Text>
          </View>
          {q.data?.verified ? <Pill label="Verified" tone="success" /> : <Pill label="Pending" />}
        </Card>

        <Field label="Shop name" value={shopName} onChangeText={setShopName} autoCapitalize="words" />
        <Field label="Stall / location" value={stall} onChangeText={setStall} autoCapitalize="words" />
        <Field label="M-Pesa Till or Paybill" value={till} onChangeText={(t) => { setTill(t.replace(/\D/g, "")); setMsg(null); }} keyboardType="number-pad" hint="Buyers pay item money straight to this number. GEKEL never holds it. Double-check it." />

        <Card className="mb-3 flex-row items-start">
          <ShieldCheck size={18} color={c.success} />
          <Text className="ml-2 flex-1 text-[13px] leading-5 text-ink-soft">Orders only move to packing after you confirm the payment landed on your Till.</Text>
        </Card>

        <View style={{ gap: 10 }} className="mt-2">
          <Button label="Contact GEKEL support" icon={HelpCircle} variant="outline" onPress={() => void Linking.openURL(`https://wa.me/${process.env.EXPO_PUBLIC_SUPPORT_WHATSAPP ?? "254700123456"}`)} />
          <Button label="Sign out" icon={LogOut} variant="danger" onPress={logout} />
        </View>
      </QueryBoundary>
    </Screen>
  );
}
