import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { MessageCircle, Send } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { FlatList, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Empty, Header, QueryBoundary, Screen } from "../../components/ui";
import { useQuery } from "../../hooks/useQuery";
import { api, ChatMessage } from "../../lib/api";
import { clock, timeAgo } from "../../lib/format";
import type { SupplierStackParams } from "../../navigation/types";
import { c } from "../../theme/tokens";

export function ChatList() {
  const nav = useNavigation<NativeStackNavigationProp<SupplierStackParams>>();
  const q = useQuery(() => api.listThreads(), [], { refreshMs: 8000 });
  return (
    <Screen header={<Header title="Chat" subtitle="Buyers on open requests and orders" />} refreshing={q.refreshing} onRefresh={q.pull}>
      <QueryBoundary loading={q.loading} error={q.error} onRetry={q.refetch}>
        {(q.data ?? []).length === 0 ? (
          <Empty icon={MessageCircle} title="No conversations yet" body="When a buyer messages you about a request or order, it appears here." />
        ) : (
          q.data!.map((t) => (
            <Pressable key={t.id} onPress={() => nav.navigate("ChatThread", { id: t.id, title: t.title, subtitle: t.subtitle })} accessibilityRole="button" className="mb-2 flex-row items-center rounded-2xl border border-line bg-white p-3 active:bg-cream">
              <View className="h-11 w-11 items-center justify-center rounded-full bg-sink">
                <Text className="text-[16px] font-bold text-ink-soft">{t.title.slice(0, 1)}</Text>
              </View>
              <View className="ml-3 flex-1">
                <View className="flex-row items-center justify-between">
                  <Text className="text-[15px] font-bold text-ink" numberOfLines={1}>{t.title}</Text>
                  <Text className="text-[12px] text-ink-mute">{timeAgo(t.lastAt)}</Text>
                </View>
                <Text className="text-[12px] text-ink-mute">{t.subtitle}</Text>
                <Text className={`mt-0.5 text-[14px] ${t.unread ? "font-semibold text-ink" : "text-ink-soft"}`} numberOfLines={1}>{t.lastMessage}</Text>
              </View>
              {t.unread > 0 ? (
                <View className="ml-2 h-6 min-w-[24px] items-center justify-center rounded-full bg-brand-500 px-1.5">
                  <Text className="text-[12px] font-bold text-white">{t.unread}</Text>
                </View>
              ) : null}
            </Pressable>
          ))
        )}
      </QueryBoundary>
    </Screen>
  );
}

const QUICK = ["Yes, it's in stock", "Sorry, not available", "Packing now", "Can you confirm the size?"];

type Props = NativeStackScreenProps<SupplierStackParams, "ChatThread">;

export function ChatThread({ route, navigation }: Props) {
  const { id, title, subtitle } = route.params;
  const insets = useSafeAreaInsets();
  const q = useQuery(() => api.listMessages(id), [id], { refreshMs: 4000 });
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [failed, setFailed] = useState<string | null>(null);
  const list = useRef<FlatList<ChatMessage>>(null);

  useEffect(() => {
    void api.markThreadRead(id);
  }, [id, q.data?.length]);

  const send = async (t = text) => {
    const body = t.trim();
    if (!body || sending) return;
    setSending(true);
    setFailed(null);
    try {
      const m = await api.sendMessage(id, body);
      q.setData((prev) => [...(prev ?? []), m]);
      setText("");
    } catch (e: any) {
      setFailed(e.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <KeyboardAvoidingView className="flex-1 bg-cream" behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <Header title={title} subtitle={subtitle} onBack={() => navigation.goBack()} />
      <View className="flex-1">
        <QueryBoundary loading={q.loading} error={q.error} onRetry={q.refetch}>
          <FlatList
            ref={list}
            data={q.data ?? []}
            keyExtractor={(m) => m.id}
            contentContainerStyle={{ padding: 16, flexGrow: 1 }}
            onContentSizeChange={() => list.current?.scrollToEnd({ animated: true })}
            ListEmptyComponent={<Empty icon={MessageCircle} title="Say hello" body="Messages stay inside GEKEL so there's a record if anything goes wrong." />}
            renderItem={({ item: m }) => (
              <View className={`mb-2 max-w-[80%] rounded-2xl px-3.5 py-2.5 ${m.mine ? "self-end rounded-br-md bg-brand-500" : "self-start rounded-bl-md border border-line bg-white"}`}>
                <Text className={`text-[15px] leading-5 ${m.mine ? "text-white" : "text-ink"}`}>{m.text}</Text>
                <Text className={`mt-1 text-[11px] ${m.mine ? "text-white-75" : "text-ink-mute"}`}>{clock(m.at)}</Text>
              </View>
            )}
          />
        </QueryBoundary>
      </View>
      {failed ? <Text className="px-4 pb-1 text-[12px] text-danger">{failed}</Text> : null}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="grow-0 border-t border-line bg-white" contentContainerStyle={{ padding: 8 }}>
        {QUICK.map((qr) => (
          <Pressable key={qr} onPress={() => void send(qr)} className="mr-2 h-9 justify-center rounded-full border border-line bg-cream px-3 active:bg-sink">
            <Text className="text-[13px] font-medium text-ink">{qr}</Text>
          </Pressable>
        ))}
      </ScrollView>
      <View className="flex-row items-end border-t border-line bg-white px-3 pt-2" style={{ paddingBottom: Math.max(insets.bottom, 8) }}>
        <TextInput value={text} onChangeText={setText} placeholder="Type a message" placeholderTextColor={c.inkMute} multiline className="max-h-28 min-h-[44px] flex-1 rounded-2xl border border-line bg-cream px-3.5 py-2.5 text-[16px] text-ink" />
        <Pressable onPress={() => void send()} disabled={!text.trim() || sending} accessibilityLabel="Send message" className={`ml-2 h-11 w-11 items-center justify-center rounded-full bg-brand-500 ${!text.trim() || sending ? "opacity-40" : ""}`}>
          <Send size={18} color={c.white} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
