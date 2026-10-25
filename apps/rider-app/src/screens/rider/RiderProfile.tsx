import { HelpCircle, LogOut, Star } from "lucide-react-native";
import { Alert, Linking, Text, View } from "react-native";
import { Button, Card, Header, QueryBoundary, Row, Screen } from "../../components/ui";
import { useQuery } from "../../hooks/useQuery";
import { api } from "../../lib/api";
import { useAuth } from "../../store/auth";
import { c } from "../../theme/tokens";

export function RiderProfile() {
  const user = useAuth((s) => s.user);
  const signOut = useAuth((s) => s.signOut);
  const q = useQuery(() => api.getRiderProfile(), []);
  const p = q.data;

  const logout = () =>
    Alert.alert("Sign out?", "You'll go offline and need a new SMS code to sign in again.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out",
        style: "destructive",
        onPress: async () => {
          await api.setOnline(false).catch(() => {});
          void signOut();
        },
      },
    ]);

  return (
    <Screen header={<Header title="Profile" />} refreshing={q.refreshing} onRefresh={q.pull}>
      <QueryBoundary loading={q.loading} error={q.error} onRetry={q.refetch}>
        <Card className="mb-3">
          <Text className="text-[20px] font-bold text-ink">{user?.name}</Text>
          <Text className="text-[14px] text-ink-soft">{user?.phone}</Text>
          {p ? (
            <View className="mt-3 flex-row items-center">
              <Star size={16} color={c.brand} fill={c.brand} />
              <Text className="ml-1.5 text-[15px] font-bold text-ink">{p.rating.toFixed(1)}</Text>
              <Text className="ml-2 text-[13px] text-ink-soft">{p.completedTotal.toLocaleString("en-KE")} deliveries</Text>
            </View>
          ) : null}
        </Card>
        {p ? (
          <Card className="mb-4">
            <Row label="Vehicle" value={p.vehicle} />
            <Row label="Plate" value={p.plate} mono />
            <Row label="Zone" value={p.zone} />
          </Card>
        ) : null}
        <View style={{ gap: 10 }}>
          <Button label="Contact GEKEL support" icon={HelpCircle} variant="outline" onPress={() => void Linking.openURL(`https://wa.me/${process.env.EXPO_PUBLIC_SUPPORT_WHATSAPP ?? "254700123456"}`)} />
          <Button label="Sign out" icon={LogOut} variant="danger" onPress={logout} />
        </View>
      </QueryBoundary>
    </Screen>
  );
}
