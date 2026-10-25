import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import * as Clipboard from "expo-clipboard";
import { Copy, MessageCircle } from "lucide-react-native";
import { useState } from "react";
import { Linking, Text, View } from "react-native";
import { Button, Card, Header, Screen } from "../../components/ui";
import type { SupplierStackParams } from "../../navigation/types";

type Props = NativeStackScreenProps<SupplierStackParams, "CatalogueImport">;
const NUMBER = process.env.EXPO_PUBLIC_SUPPORT_WHATSAPP ?? "254700123456";
const pretty = `+${NUMBER.slice(0, 3)} ${NUMBER.slice(3, 6)} ${NUMBER.slice(6, 9)} ${NUMBER.slice(9)}`;

const STEPS = [
  { t: "Collect your products", d: "Photos with the name and price in the caption work best. Screenshots of your WhatsApp Business catalogue are fine too." },
  { t: "Forward them to GEKEL", d: "Send everything to the GEKEL WhatsApp number below, from the phone number you registered with." },
  { t: "We add them for you", d: "A GEKEL team member enters your products and you'll see them in your catalogue, usually within a day. You can edit anything after." },
];

export function CatalogueImport({ navigation }: Props) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await Clipboard.setStringAsync(`+${NUMBER}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  const open = () => void Linking.openURL(`https://wa.me/${NUMBER}?text=${encodeURIComponent("Hi GEKEL, here is my product catalogue.")}`);

  return (
    <Screen header={<Header title="Import your catalogue" subtitle="Done for you, no typing" onBack={() => navigation.goBack()} />} footer={<Button label="Open WhatsApp" icon={MessageCircle} onPress={open} />}>
      {STEPS.map((s, i) => (
        <Card key={s.t} className="mb-3 flex-row">
          <View className="h-7 w-7 items-center justify-center rounded-full bg-brand-500">
            <Text className="text-[13px] font-bold text-white">{i + 1}</Text>
          </View>
          <View className="ml-3 flex-1">
            <Text className="text-[16px] font-bold text-ink">{s.t}</Text>
            <Text className="mt-1 text-[14px] leading-5 text-ink-soft">{s.d}</Text>
          </View>
        </Card>
      ))}
      <Card className="flex-row items-center justify-between">
        <View>
          <Text className="text-[12px] font-semibold uppercase tracking-wider text-ink-soft">GEKEL WhatsApp</Text>
          <Text className="mt-0.5 text-[18px] font-extrabold text-ink">{pretty}</Text>
        </View>
        <Button label={copied ? "Copied" : "Copy"} icon={Copy} variant="outline" small onPress={copy} />
      </Card>
      <Text className="mt-4 text-center text-[13px] text-ink-mute">Prefer to add items yourself? Use “Add product” in your catalogue.</Text>
    </Screen>
  );
}
