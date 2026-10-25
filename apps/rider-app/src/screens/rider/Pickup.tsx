import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Phone, ScanLine } from "lucide-react-native";
import { useState } from "react";
import { Text, View } from "react-native";
import { CodeScanner } from "../../components/CodeScanner";
import { PhotoField } from "../../components/PhotoField";
import { Banner, Button, Card, Field, Header, QueryBoundary, Screen } from "../../components/ui";
import { useQuery } from "../../hooks/useQuery";
import { api, MOCK_HINTS, USING_MOCK } from "../../lib/api";
import { callNumber, openDirections } from "../../lib/maps";
import type { RiderStackParams } from "../../navigation/types";

type Props = NativeStackScreenProps<RiderStackParams, "Pickup">;

export function Pickup({ route, navigation }: Props) {
  const { id } = route.params;
  const q = useQuery(() => api.getActiveDelivery(), [id]);
  const d = q.data;
  const [code, setCode] = useState("");
  const [photo, setPhoto] = useState<string>();
  const [scanning, setScanning] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confirm = async () => {
    if (!d || !photo || !code.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await api.confirmPickup(d.id, { code: code.trim(), photoUri: photo });
      await api.startTransit(d.id);
      navigation.replace("Transit", { id: d.id });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen
      keyboard
      header={<Header title="Pickup" subtitle={d?.orderCode} onBack={() => navigation.popToTop()} />}
      footer={<Button label="Confirm pickup and start trip" onPress={confirm} loading={busy} disabled={!photo || !code.trim()} />}
    >
      <QueryBoundary loading={q.loading} error={q.error} onRetry={q.refetch}>
        {!d ? (
          <Banner tone="neutral">No active delivery.</Banner>
        ) : (
          <>
            {error ? <Banner tone="danger">{error}</Banner> : null}
            {USING_MOCK ? <Banner tone="brand">Demo mode: the seal code is {d.orderCode === "#GK-8821" ? MOCK_HINTS.sealCodes[0] : MOCK_HINTS.sealCodes[1]}.</Banner> : null}
            <Card>
              <Text className="text-[11px] font-bold uppercase tracking-wider text-ink-soft">Go to</Text>
              <Text className="mt-0.5 text-[18px] font-bold text-ink">{d.pickup.name}</Text>
              <Text className="text-[14px] text-ink-soft">{d.pickup.detail}</Text>
              <View className="mt-3 flex-row" style={{ gap: 10 }}>
                <Button className="flex-1" label="Directions" variant="outline" small onPress={() => openDirections(d.pickup.point, d.pickup.name)} />
                <Button className="flex-1" label="Call" icon={Phone} variant="outline" small onPress={() => callNumber(d.pickup.phone)} />
              </View>
            </Card>

            <Text className="mb-2 mt-5 text-[13px] font-semibold uppercase tracking-wider text-ink-soft">1. Check the seal</Text>
            <Text className="mb-3 text-[14px] text-ink-soft">Scan the code the supplier shows you, or type it. It must match this order.</Text>
            <Button label="Scan seal code" icon={ScanLine} variant="dark" onPress={() => setScanning(true)} />
            <View className="h-3" />
            <Field label="Or type the code" value={code} onChangeText={(t) => { setCode(t.toUpperCase()); setError(null); }} autoCapitalize="characters" autoCorrect={false} placeholder="GK-10441-ABC" />

            <Text className="mb-2 mt-2 text-[13px] font-semibold uppercase tracking-wider text-ink-soft">2. Photo of the sealed parcel</Text>
            <PhotoField source="camera" value={photo} onChange={setPhoto} hint="The seal and tape must be clearly visible." aspect={1.4} />
          </>
        )}
      </QueryBoundary>
      <CodeScanner visible={scanning} onClose={() => setScanning(false)} onScan={(data) => { setCode(data.trim().toUpperCase()); setScanning(false); }} />
    </Screen>
  );
}
