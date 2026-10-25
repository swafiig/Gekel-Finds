import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Check } from "lucide-react-native";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { PhotoField } from "../../components/PhotoField";
import { Banner, Button, Field, Header, Screen } from "../../components/ui";
import { api } from "../../lib/api";
import type { SupplierStackParams } from "../../navigation/types";
import { c } from "../../theme/tokens";

type Props = NativeStackScreenProps<SupplierStackParams, "PackProof">;

const CHECKS = ["Items match the order (quantity, size, colour)", "Parcel is sealed with GEKEL tape or box", "Photo shows the sealed parcel clearly"];

export function PackProof({ route, navigation }: Props) {
  const { id } = route.params;
  const [photo, setPhoto] = useState<string>();
  const [serial, setSerial] = useState("");
  const [checks, setChecks] = useState<boolean[]>(CHECKS.map(() => false));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ready = !!photo && checks.every(Boolean);

  const submit = async () => {
    if (!ready) return;
    setBusy(true);
    setError(null);
    try {
      await api.submitPackProof(id, { photoUri: photo!, sealSerial: serial.trim() || undefined });
      navigation.goBack();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen keyboard header={<Header title="Packing proof" subtitle="Every handoff is a photo" onBack={() => navigation.goBack()} />} footer={<Button label="Submit proof" onPress={submit} loading={busy} disabled={!ready} />}>
      {error ? <Banner tone="danger">{error}</Banner> : null}
      <PhotoField source="camera" label="Photo of the sealed parcel" value={photo} onChange={setPhoto} hint="Take it now. The time is recorded with the photo." aspect={1.25} />
      <Field label="Seal serial (if your seal has one)" value={serial} onChangeText={(t) => setSerial(t.toUpperCase())} autoCapitalize="characters" placeholder="e.g. SEC-9980-NBO" hint="The rider will check this at pickup." />

      <Text className="mb-2 text-[13px] font-semibold text-ink">Before you submit</Text>
      {CHECKS.map((label, i) => (
        <Pressable key={label} onPress={() => setChecks((a) => a.map((v, j) => (j === i ? !v : v)))} accessibilityRole="checkbox" accessibilityState={{ checked: checks[i] }} className="mb-2 flex-row items-center rounded-xl border border-line bg-white p-3">
          <View className={`h-6 w-6 items-center justify-center rounded-md border ${checks[i] ? "border-success bg-success" : "border-ink-mute bg-white"}`}>{checks[i] ? <Check size={16} color={c.white} /> : null}</View>
          <Text className="ml-3 flex-1 text-[14px] text-ink">{label}</Text>
        </Pressable>
      ))}
    </Screen>
  );
}
