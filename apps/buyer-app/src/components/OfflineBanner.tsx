import React, { useEffect, useRef } from 'react';
import { Animated, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useOffline } from '../context/OfflineContext';

/**
 * A thin strip pinned under the status bar whenever the phone has no connection.
 * What still works offline: browsing (Home, Finds, Suppliers — their data is bundled with the app),
 * your saved Requests/Orders/Chats, and writing chat messages (they queue and send once you're back).
 * What is paused: placing new orders, payments, and anything else that needs the server right now.
 */
export default function OfflineBanner() {
  const { isOffline, syncing, outbox } = useOffline();
  const insets = useSafeAreaInsets();
  const show = isOffline || syncing || outbox.length > 0;
  const y = useRef(new Animated.Value(show ? 0 : -60)).current;

  useEffect(() => {
    Animated.spring(y, { toValue: show ? 0 : -60, useNativeDriver: true, bounciness: 4 }).start();
  }, [show, y]);

  if (!show && outbox.length === 0) return null;

  const label = isOffline
    ? "You're offline — browsing still works, new orders and payments are paused"
    : syncing
      ? 'Back online — sending what you queued…'
      : `${outbox.length} message${outbox.length === 1 ? '' : 's'} waiting to send`;
  const tone = isOffline ? 'bg-ink' : 'bg-success';

  return (
    <Animated.View
      pointerEvents="none"
      style={{ transform: [{ translateY: y }], paddingTop: insets.top, position: 'absolute', top: 0, left: 0, right: 0, zIndex: 50 }}
      className={tone}
    >
      <View className="flex-row items-center justify-center px-4 py-2">
        <Ionicons name={isOffline ? 'cloud-offline-outline' : 'sync-outline'} size={14} color="#fff" />
        <Text numberOfLines={1} className="ml-2 flex-1 text-center text-xs font-semibold text-white">{label}</Text>
      </View>
    </Animated.View>
  );
}
