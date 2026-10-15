import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { setOfflineFlag } from '../services/http';

/** A chat message that was sent while offline and is waiting to be confirmed. Purely a UI record for now. */
export interface OutboxItem { id: string; chatId: string; text: string; createdAt: number }

interface Ctx {
  isOffline: boolean;
  /** True for a moment right after reconnecting, so the UI can show "back online" before the banner clears. */
  syncing: boolean;
  outbox: OutboxItem[];
  /** Call when a message is sent while offline, so it shows a "waiting to send" badge until reconnect. */
  queueMessage: (chatId: string, text: string) => void;
}

const OfflineContext = createContext<Ctx | null>(null);
const uid = () => Math.random().toString(36).slice(2, 9);

export function OfflineProvider({ children }: { children: React.ReactNode }) {
  const [isOffline, setIsOffline] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [outbox, setOutbox] = useState<OutboxItem[]>([]);
  const wasOffline = useRef(false);

  useEffect(() => {
    const unsub = NetInfo.addEventListener((state) => {
      // isInternetReachable can briefly read null right after a change; treat that as "assume online"
      // rather than flashing the offline banner for no reason.
      const offline = state.isConnected === false || state.isInternetReachable === false;
      setOfflineFlag(offline);
      setIsOffline(offline);
      if (wasOffline.current && !offline && outbox.length) {
        // TODO: once chat has a real backend, POST each queued item here instead of just clearing it.
        setSyncing(true);
        setTimeout(() => { setOutbox([]); setSyncing(false); }, 900);
      }
      wasOffline.current = offline;
    });
    return unsub;
  }, [outbox.length]);

  const queueMessage = (chatId: string, text: string) => setOutbox((p) => [...p, { id: uid(), chatId, text, createdAt: Date.now() }]);

  const value = useMemo(() => ({ isOffline, syncing, outbox, queueMessage }), [isOffline, syncing, outbox]);
  return <OfflineContext.Provider value={value}>{children}</OfflineContext.Provider>;
}

export const useOffline = () => {
  const c = useContext(OfflineContext);
  if (!c) throw new Error('useOffline must be used inside <OfflineProvider>');
  return c;
};
