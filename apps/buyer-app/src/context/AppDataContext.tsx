import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { PRODUCTS, REQUEST_STAGES, ORDER_STAGES, DELIVERY_FEE } from '../data/mock';

/* ─────────── Types ─────────── */
export interface GekelRequest {
  id: string;
  title: string;
  category?: string;
  budget?: number;
  urgency: 'sameDay' | 'standard';
  photoUri?: string;
  stage: number; // index into REQUEST_STAGES
  cancelled?: boolean;
  createdAt: number;
}

export interface Order {
  id: string;
  productId: string;
  price: number;
  deliveryFee: number;
  stage: number; // index into ORDER_STAGES
  sealNo: string;
  riderName: string;
  riderPhone: string;
  etaMinutes: number;
  createdAt: number;
}

export interface Message {
  id: string;
  from: 'me' | 'them';
  text: string;
  at: number;
}
export interface ChatThread {
  id: string;
  name: string;
  role: string;
  unread: number;
  messages: Message[];
}

export type RequestStatus = 'Active' | 'Found' | 'Delivered' | 'Cancelled';
export const requestStatus = (r: GekelRequest): RequestStatus =>
  r.cancelled
    ? 'Cancelled'
    : r.stage >= REQUEST_STAGES.length - 1
    ? 'Delivered'
    : r.stage >= 2
    ? 'Found'
    : 'Active';

export const requestNote = (r: GekelRequest) => {
  if (r.cancelled) return 'Cancelled';
  if (r.stage <= 1)
    return `Searching… Day ${Math.min(3, 1 + Math.floor((Date.now() - r.createdAt) / 86400000))} of 3`;
  return REQUEST_STAGES[r.stage];
};

interface Ctx {
  requests: GekelRequest[];
  orders: Order[];
  chats: ChatThread[];
  favorites: string[];
  unreadNotifications: number;
  addRequest: (r: Omit<GekelRequest, 'id' | 'stage' | 'createdAt'>) => string;
  cancelRequest: (id: string) => void;
  advanceRequest: (id: string) => void;
  placeOrder: (productId: string) => string;
  advanceOrder: (id: string) => void;
  toggleFavorite: (productId: string) => void;
  sendMessage: (chatId: string, text: string) => void;
  markChatRead: (chatId: string) => void;
  markNotificationsRead: () => void;
}

const uid = () => Math.random().toString(36).slice(2, 9);
const AppData = createContext<Ctx | null>(null);

const now = Date.now();
const SEED_REQUESTS: GekelRequest[] = [
  {
    id: 'r1',
    title: 'Black hoodie under KSh 2,000',
    category: 'Clothing',
    budget: 2000,
    urgency: 'standard',
    stage: 1,
    createdAt: now - 3 * 3600000,
  },
];
const SEED_ORDERS: Order[] = [
  {
    id: 'o1',
    productId: 'p3',
    price: 1200,
    deliveryFee: DELIVERY_FEE,
    stage: 2,
    sealNo: 'GKL-48213',
    riderName: 'Brian Mwangi',
    riderPhone: '+254700000111',
    etaMinutes: 15,
    createdAt: now - 2 * 3600000,
  },
  {
    id: 'o2',
    productId: 'p5',
    price: 950,
    deliveryFee: DELIVERY_FEE,
    stage: 3,
    sealNo: 'GKL-47102',
    riderName: 'Faith Achieng',
    riderPhone: '+254700000222',
    etaMinutes: 0,
    createdAt: now - 3 * 86400000,
  },
];
const SEED_CHATS: ChatThread[] = [
  {
    id: 'c1',
    name: 'Wanjiru',
    role: 'Field shopper · Gikomba',
    unread: 1,
    messages: [
      { id: 'm1', from: 'me', text: 'Hi, any luck with the black hoodie?', at: now - 3600000 },
      {
        id: 'm2',
        from: 'them',
        text: 'Found one in Gikomba, KSh 1,800. Want me to send a photo?',
        at: now - 1800000,
      },
    ],
  },
  {
    id: 'c2',
    name: 'GEKEL Support',
    role: 'We reply within minutes',
    unread: 0,
    messages: [
      {
        id: 'm3',
        from: 'them',
        text: 'Welcome to GEKEL! Ask us anything about your orders.',
        at: now - 86400000,
      },
    ],
  },
];

export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const [requests, setRequests] = useState<GekelRequest[]>(SEED_REQUESTS);
  const [orders, setOrders] = useState<Order[]>(SEED_ORDERS);
  const [chats, setChats] = useState<ChatThread[]>(SEED_CHATS);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [unreadNotifications, setUnread] = useState(2);

  const addRequest: Ctx['addRequest'] = useCallback((r) => {
    const id = uid();
    setRequests((p) => [{ ...r, id, stage: 0, createdAt: Date.now() }, ...p]);
    // TODO: POST /requests
    setTimeout(
      () =>
        setRequests((p) =>
          p.map((x) => (x.id === id && x.stage === 0 ? { ...x, stage: 1 } : x)),
        ),
      2500,
    );
    return id;
  }, []);

  const cancelRequest: Ctx['cancelRequest'] = useCallback((id) => {
    setRequests((p) => p.map((x) => (x.id === id ? { ...x, cancelled: true } : x)));
  }, []);

  const advanceRequest: Ctx['advanceRequest'] = useCallback((id) => {
    setRequests((p) =>
      p.map((x) =>
        x.id === id
          ? { ...x, stage: Math.min(x.stage + 1, REQUEST_STAGES.length - 1) }
          : x,
      ),
    );
  }, []);

  const placeOrder: Ctx['placeOrder'] = useCallback((productId) => {
    const product = PRODUCTS.find((p) => p.id === productId);
    const id = uid();
    const order: Order = {
      id,
      productId,
      price: product?.price ?? 0,
      deliveryFee: DELIVERY_FEE,
      stage: 0,
      sealNo: `GKL-${Math.floor(10000 + Math.random() * 89999)}`,
      riderName: 'Assigning…',
      riderPhone: '',
      etaMinutes: 30,
      createdAt: Date.now(),
    };
    setOrders((p) => [order, ...p]);
    // TODO: POST /orders
    return id;
  }, []);

  const advanceOrder: Ctx['advanceOrder'] = useCallback((id) => {
    setOrders((p) =>
      p.map((o) =>
        o.id === id ? { ...o, stage: Math.min(o.stage + 1, ORDER_STAGES.length - 1) } : o,
      ),
    );
  }, []);

  const toggleFavorite: Ctx['toggleFavorite'] = useCallback((productId) => {
    setFavorites((p) =>
      p.includes(productId) ? p.filter((x) => x !== productId) : [...p, productId],
    );
  }, []);

  const sendMessage: Ctx['sendMessage'] = useCallback((chatId, text) => {
    setChats((p) =>
      p.map((c) =>
        c.id === chatId
          ? {
              ...c,
              messages: [...c.messages, { id: uid(), from: 'me', text, at: Date.now() }],
            }
          : c,
      ),
    );
  }, []);

  const markChatRead: Ctx['markChatRead'] = useCallback((chatId) => {
    setChats((p) => p.map((c) => (c.id === chatId ? { ...c, unread: 0 } : c)));
  }, []);

  const markNotificationsRead = useCallback(() => setUnread(0), []);

  const value = useMemo<Ctx>(
    () => ({
      requests,
      orders,
      chats,
      favorites,
      unreadNotifications,
      addRequest,
      cancelRequest,
      advanceRequest,
      placeOrder,
      advanceOrder,
      toggleFavorite,
      sendMessage,
      markChatRead,
      markNotificationsRead,
    }),
    [
      requests,
      orders,
      chats,
      favorites,
      unreadNotifications,
      addRequest,
      cancelRequest,
      advanceRequest,
      placeOrder,
      advanceOrder,
      toggleFavorite,
      sendMessage,
      markChatRead,
      markNotificationsRead,
    ],
  );

  return <AppData.Provider value={value}>{children}</AppData.Provider>;
}

export const useAppData = () => {
  const ctx = useContext(AppData);
  if (!ctx) throw new Error('useAppData must be used inside <AppDataProvider>');
  return ctx;
};