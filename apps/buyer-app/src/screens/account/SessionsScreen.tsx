import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  Text,
  View,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Screen from "../../components/Screen";
import BackHeader from "../../components/BackHeader";
import Button from "../../components/Button";
import FormError from "../../components/FormError";
import { useAuth } from "../../context/AuthContext";
import { authApi, SessionInfo } from "../../services/authApi";
import { friendlyError } from "../../utils/apiErrors";
import { timeAgo } from "../../data/mock";

/** Devices currently signed in to this account, with per-device sign-out. */
export default function SessionsScreen() {
  const { logoutAll } = useAuth();
  const [list, setList] = useState<SessionInfo[] | null>(null);
  const [error, setError] = useState<string>();
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setError(undefined);
      setList(await authApi.sessions());
    } catch (e) {
      setError(friendlyError(e, "Could not load your devices."));
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const revoke = (s: SessionInfo) =>
    Alert.alert("Sign out this device?", s.device_name || "Unknown device", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out",
        style: "destructive",
        onPress: async () => {
          try {
            await authApi.revokeSession(s.id);
            await load();
          } catch (e) {
            setError(friendlyError(e));
          }
        },
      },
    ]);

  const signOutEverywhere = () =>
    Alert.alert(
      "Sign out of all devices?",
      "You will need to log in again here too.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign out everywhere",
          style: "destructive",
          onPress: async () => {
            try {
              await logoutAll();
            } catch (e) {
              setError(friendlyError(e));
            }
          },
        },
      ],
    );

  return (
    <Screen>
      <BackHeader title="Security & devices" />
      <Text className="mb-4 mt-3 text-sm leading-5 text-ink-soft">
        These devices are signed in to your account. If you do not recognise
        one, sign it out and change your password.
      </Text>
      <FormError message={error} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await load();
              setRefreshing(false);
            }}
            tintColor="#FA3504"
          />
        }
      >
        {list === null && !error ? (
          <ActivityIndicator color="#FA3504" style={{ marginTop: 40 }} />
        ) : null}
        {list?.map((s) => (
          <View
            key={s.id}
            className={`mb-3 flex-row items-center rounded-2xl border bg-white p-4 ${s.current ? "border-brand-500" : "border-line"}`}
          >
            <View className="h-11 w-11 items-center justify-center rounded-full bg-brand-50">
              <Ionicons
                name="phone-portrait-outline"
                size={20}
                color="#FA3504"
              />
            </View>
            <View className="ml-3 flex-1">
              <View className="flex-row items-center">
                <Text
                  numberOfLines={1}
                  className="shrink text-base font-bold text-ink"
                >
                  {s.device_name || "Unknown device"}
                </Text>
                {s.current && (
                  <View className="ml-2 rounded-full bg-brand-500 px-2 py-0.5">
                    <Text className="text-[10px] font-bold text-white">
                      THIS DEVICE
                    </Text>
                  </View>
                )}
              </View>
              <Text className="mt-0.5 text-xs text-ink-soft">
                Active {timeAgo(new Date(s.last_used_at).getTime())}
                {s.ip_address ? ` · ${s.ip_address}` : ""}
              </Text>
            </View>
            {!s.current && (
              <Pressable hitSlop={8} onPress={() => revoke(s)}>
                <Text className="text-sm font-bold text-danger">Sign out</Text>
              </Pressable>
            )}
          </View>
        ))}
      </ScrollView>
      {list && list.length > 1 ? (
        <Button
          title="Sign out of all devices"
          variant="danger"
          className="mt-2"
          onPress={signOutEverywhere}
        />
      ) : null}
    </Screen>
  );
}
