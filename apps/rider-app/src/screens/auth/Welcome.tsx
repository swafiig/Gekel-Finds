import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ArrowRight } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Logo } from "../../components/Logo";
import type { AuthStackParams } from "../../navigation/types";
import { c } from "../../theme/tokens";

type Props = NativeStackScreenProps<AuthStackParams, "Welcome">;

export function Welcome({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View className="flex-1 bg-brand-500" style={{ paddingTop: insets.top + 24, paddingBottom: insets.bottom + 20 }}>
      <View className="flex-1 px-6">
        <View className="flex-row items-center">
          <Logo size={44} tone="white" />
          <Text className="ml-3 text-[26px] font-extrabold tracking-wide text-white">GEKEL</Text>
          <View className="ml-2 rounded-md bg-white-20 px-2 py-0.5">
            <Text className="text-[11px] font-bold uppercase tracking-wider text-white">Rider</Text>
          </View>
        </View>

        <View className="flex-1 justify-center">
          <Text className="text-[38px] font-extrabold leading-[44px] text-white">{"Pick up.\nDeliver. Get paid."}</Text>
          <Text className="mt-4 text-[16px] leading-6 text-white-85">{"Go online, accept nearby jobs, scan the seal at pickup and finish with the customer's code."}</Text>
        </View>

        <Pressable onPress={() => navigation.navigate("Login")} accessibilityRole="button" className="h-14 flex-row items-center justify-center rounded-xl bg-white active:bg-brand-50">
          <Text className="mr-2 text-[16px] font-bold text-ink">Rider sign in</Text>
          <ArrowRight size={18} color={c.ink} />
        </Pressable>
        <Text className="mt-4 text-center text-[12px] text-white-75">{"Every handoff is a photo, so everyone is protected."}</Text>
      </View>
    </View>
  );
}
