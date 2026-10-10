import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import * as Location from 'expo-location';
import { DELIVERED, DeliveryChoice, ORDER_STAGES, PRODUCTS, REQUEST_STAGES, SERVICE_FEE, SUPPLIERS, Supplier, courierScript, deliveryFee } from '../data/mock';

/* ═════════ Types ═════════ */
export interface GekelRequest {
  id: string; title: string; kind?: 'search' | 'ownSupplier';
  supplier?: { name: string; phone: string; location: string; till?: string };
  category?: string; budget?: number; urgency: 'sameDay' | 'standard'; photoUri?: string;
  stage: number; cancelled?: boolean; createdAt: number;
}

export interface Address {
  id: string; label: 'Home' | 'Work' | 'Other';
  county: string; town: string; area: string; building: string; unit: string; landmark: string;
  phone: string; lat?: number; lng?: number; isDefault: boolean;
}
export const formatAddress = (a: Pick<Address, 'unit' | 'building' | 'area' | 'town' | 'county' | 'landmark'>) =>
  [a.unit, a.building, a.area, a.town, a.county].filter(Boolean).join(', ') + (a.landmark ? ` (near ${a.landmark})` : '');

export interface PayNumber { id: string; number: string; isDefault: boolean }
export interface CartLine { productId: string; qty: number; selected: boolean }

export interface TrackEvent {
  id: string; title: string; note?: string; at: number;
  photo?: 'sealed' | 'pickup' | 'delivery' | 'receipt';
  imageUri?: string; // rider upload (URL from your API)
}
export interface CourierEvent { id: string; at: number; text: string }
export interface CourierInfo { name: string; waybill: string; receiptUri?: string; events: CourierEvent[] }
export interface OrderItem { productId: string; qty: number; unitPrice: number }

export interface Order {
  id: string; bundleId?: string; stops: number;
  supplierId: string; chatId: string; items: OrderItem[];
  price: number; deliveryFee: number; serviceFee: number; deliveryPaid: boolean;
  delivery: DeliveryChoice; address: string; coords?: { lat: number; lng: number };
  dropship?: { name: string; phone: string };
  quote: 'pending' | 'accepted' | 'declined'; cancelled?: boolean;
  paymentNote?: string; stage: number; sealNo: string;
  rider: { name: string; phone: string; vehicle: string };
  courier?: CourierInfo; etaMinutes: number; createdAt: number;
  events: TrackEvent[]; rating?: { supplier: number; rider: number };
}

export type MsgKind = 'text' | 'quote' | 'till' | 'payment';
export interface Message {
  id: string; from: 'me' | 'them'; text: string; at: number; kind?: MsgKind;
  till?: string; amount?: number; orderId?: string; imageUri?: string;
}
export interface ChatThread {
  id: string; name: string; role: string; unread: number; online: boolean; lastSeen: number;
  supplierId?: string; messages: Message[];
}

export const orderStages = (o: Pick<Order, 'delivery'>) =>
  o.delivery.method === 'courier' ? ['Awaiting payment', 'Payment confirmed', 'Packed & sealed', 'Handed to courier', 'Delivered'] : ORDER_STAGES;
export const isActive = (o: Order) => !o.cancelled && o.stage < DELIVERED;

export type RequestStatus = 'Active' | 'Found' | 'Delivered' | 'Cancelled';
export const requestStatus = (r: GekelRequest): RequestStatus =>
  r.cancelled ? 'Cancelled' : r.stage >= REQUEST_STAGES.length - 1 ? 'Delivered' : r.stage >= 2 ? 'Found' : 'Active';
export const requestNote = (r: GekelRequest) => {
  if (r.cancelled) return 'Cancelled';
  if (r.stage <= 1) return `Searching… Day ${Math.min(3, 1 + Math.floor((Date.now() - r.createdAt) / 86400000))} of 3`;
  return REQUEST_STAGES[r.stage];
};

export const modeFor = (productId: string, qty: number): 'retail' | 'wholesale' => {
  const p = PRODUCTS.find((x) => x.id === productId)!;
  const s = SUPPLIERS.find((x) => x.id === p.supplierId)!;
  return p.wholesale && s.type !== 'retail' && qty >= p.wholesale.minQty ? 'wholesale' : 'retail';
};
export const unitPriceFor = (productId: string, qty: number) => {
  const p = PRODUCTS.find((x) => x.id === productId)!;
  return modeFor(productId, qty) === 'wholesale' ? p.wholesale!.unitPrice : p.price;
};

interface BundleInput {
  lines: { productId: string; qty: number }[];
  address: Address; delivery: DeliveryChoice; dropship?: { name: string; phone: string };
}

interface Ctx {
  requests: GekelRequest[]; orders: Order[]; chats: ChatThread[]; favorites: string[]; cart: CartLine[];
  addresses: Address[]; defaultAddress?: Address; payNumbers: PayNumber[];
  avatarUri?: string; userCoords?: { lat: number; lng: number }; locationDenied: boolean;
  unreadNotifications: number; resellerMode: boolean;
  setResellerMode: (v: boolean) => void; setAvatarUri: (u?: string) => void;
  requestLocation: () => Promise<boolean>;
  addRequest: (r: Omit<GekelRequest, 'id' | 'stage' | 'createdAt'>) => string;
  cancelRequest: (id: string) => void; advanceRequest: (id: string) => void;
  addToCart: (productId: string, qty?: number) => void; setCartQty: (productId: string, qty: number) => void;
  removeFromCart: (productId: string) => void; toggleCartSelect: (productId: string) => void;
  selectAllCart: (v: boolean) => void; clearOrdered: (productIds: string[]) => void;
  addAddress: (a: Omit<Address, 'id'>) => string; updateAddress: (id: string, patch: Partial<Address>) => void;
  deleteAddress: (id: string) => void; setDefaultAddress: (id: string) => void;
  addPayNumber: (n: string) => void; removePayNumber: (id: string) => void; setDefaultPay: (id: string) => void;
  placeBundle: (i: BundleInput) => { bundleId: string; orderIds: string[]; chatIds: string[] };
  respondQuote: (order: Order, accept: boolean) => void;
  payWithPrompt: (order: Order, phone: string) => void;
  attachPayment: (orderId: string, chatId: string, proof: { text?: string; imageUri?: string }) => void;
  confirmReceived: (orderId: string) => void; rateOrder: (orderId: string, r: { supplier: number; rider: number }) => void;
  advanceOrder: (id: string) => void; advanceCourier: (id: string) => void;
  toggleFavorite: (productId: string) => void; openSupplierChat: (supplierId: string) => string;
  sendMessage: (chatId: string, text: string, imageUri?: string) => void;
  markChatRead: (chatId: string) => void; markNotificationsRead: () => void;
}

const uid = () => Math.random().toString(36).slice(2, 9);
const AppData = createContext<Ctx | null>(null);
const sup = (id: string) => SUPPLIERS.find((s) => s.id === id)!;

const replyFor = (t: string) => {
  const s = t.toLowerCase();
  if (/available|stock/.test(s)) return 'Yes, it is available ✅ How many do you need?';
  if (/price|last|discount|cheap/.test(s)) return 'That is already the market price. For wholesale quantities I can do better.';
  if (/photo|picture|pic/.test(s)) return 'Sure, sending a photo from the stall shortly 📷';
  if (/deliver|time|when/.test(s)) return 'We pack within an hour and a GEKEL rider delivers same day in Nairobi.';
  if (/wholesale|bulk/.test(s)) return 'Wholesale starts from the minimum quantity shown on the item page. Want a quote?';
  return 'Got it! Give me a few minutes and I will update you here.';
};

/* ═════════ Order progression ═════════ */
const advance = (o: Order): Order => {
  if (o.stage >= DELIVERED) return o;
  const stage = o.stage + 1;
  const courier = o.delivery.method === 'courier';
  let courierInfo = o.courier;
  let ev: Omit<TrackEvent, 'id' | 'at'>;
  if (stage === 1) ev = { title: 'Payment confirmed', note: 'Supplier confirmed your M-Pesa payment' };
  else if (stage === 2) ev = { title: 'Packed & tamper-sealed', note: `Seal ${o.sealNo}`, photo: 'sealed' };
  else if (stage === 3 && courier) {
    courierInfo = { name: o.delivery.courier ?? 'Courier', waybill: `FG${Math.floor(1000000 + Math.random() * 8999999)}`, events: [{ id: uid(), at: Date.now(), text: courierScript('your town')[0] }] };
    ev = { title: 'Handed to courier', note: `${courierInfo.name} · Waybill ${courierInfo.waybill}. Receipt photo from rider.`, photo: 'receipt' };
  } else if (stage === 3) ev = { title: o.delivery.speed === 'express' ? 'Express rider on the way' : 'Rider picked up your order', note: `${o.rider.name} · ${o.rider.vehicle}`, photo: 'pickup' };
  else ev = { title: 'Delivered', note: 'Delivered and confirmed', photo: 'delivery' };
  return {
    ...o, stage, courier: courierInfo, etaMinutes: stage === 4 ? 0 : stage === 3 ? (o.delivery.speed === 'express' ? 25 : 40) : 60,
    deliveryPaid: stage === DELIVERED ? true : o.deliveryPaid, events: [...o.events, { id: uid(), at: Date.now(), ...ev }],
  };
};

/* ═════════ Seed data ═════════ */
const now = Date.now();
const H = 3600000;
const rider = { name: 'Brian Mwangi', phone: '+254700000111', vehicle: 'Motorbike · KMFG 123A' };
const stdRider: DeliveryChoice = { method: 'rider', speed: 'standard', dest: 'door', pay: 'later' };

const SEED_ADDRESSES: Address[] = [
  { id: 'a1', label: 'Home', county: 'Nairobi', town: 'Nairobi', area: 'Kilimani', building: 'Argwings Court', unit: 'Apt 4B', landmark: 'Yaya Centre', phone: '0712345678', lat: -1.2921, lng: 36.7872, isDefault: true },
];
const SEED_PAY: PayNumber[] = [{ id: 'p1', number: '0712345678', isDefault: true }];
const SEED_REQUESTS: GekelRequest[] = [
  { id: 'r1', title: 'Black hoodie under KSh 2,000', category: 'Clothing', budget: 2000, urgency: 'standard', stage: 1, createdAt: now - 3 * H },
];
const courierSeedEvents = courierScript('FARGO').map((text, i) => ({ id: `ce${i}`, at: now - (48 - i * 6) * H, text }));
const SEED_ORDERS: Order[] = [
  { id: 'o1', stops: 1, supplierId: 's3', chatId: 's-s3', items: [{ productId: 'p3', qty: 1, unitPrice: 1200 }], price: 1200, deliveryFee: 150, serviceFee: SERVICE_FEE, deliveryPaid: false,
    delivery: stdRider, address: 'Apt 4B, Argwings Court, Kilimani, Nairobi', quote: 'accepted', stage: 3, sealNo: 'GKL-48213', rider, etaMinutes: 15, createdAt: now - 2 * H,
    events: [
      { id: 'e1', at: now - 115 * 60000, title: 'Payment confirmed', note: 'Supplier confirmed your M-Pesa payment' },
      { id: 'e2', at: now - 80 * 60000, title: 'Packed & tamper-sealed', note: 'Seal GKL-48213', photo: 'sealed' },
      { id: 'e3', at: now - 30 * 60000, title: 'Rider picked up your order', note: 'Brian Mwangi · Motorbike · KMFG 123A', photo: 'pickup' },
    ] },
  { id: 'o2', stops: 1, supplierId: 's5', chatId: 's-s5', items: [{ productId: 'p5', qty: 1, unitPrice: 950 }], price: 950, deliveryFee: 150, serviceFee: SERVICE_FEE, deliveryPaid: true,
    delivery: { ...stdRider, pay: 'now' }, address: 'Sarit Centre, Westlands, Nairobi', quote: 'accepted', stage: 4, sealNo: 'GKL-47102', rider: { ...rider, name: 'Faith Achieng' }, etaMinutes: 0, createdAt: now - 3 * 86400000,
    events: [{ id: 'e4', at: now - 3 * 86400000 + 5400000, title: 'Delivered', note: 'Delivered and confirmed', photo: 'delivery' }] },
  { id: 'o3', stops: 1, supplierId: 's2', chatId: 's-s2', items: [{ productId: 'p6', qty: 2, unitPrice: 1800 }], price: 3600, deliveryFee: 450, serviceFee: SERVICE_FEE, deliveryPaid: true,
    delivery: { method: 'courier', speed: 'standard', dest: 'door', courier: 'Fargo Courier', pay: 'now' }, address: 'Milimani Rd, Nakuru, Nakuru', quote: 'accepted', stage: 3, sealNo: 'GKL-46650', rider, etaMinutes: 0, createdAt: now - 3 * 86400000,
    courier: { name: 'Fargo Courier', waybill: 'FG4821907', events: courierSeedEvents },
    events: [
      { id: 'e5', at: now - 70 * H, title: 'Packed & tamper-sealed', note: 'Seal GKL-46650', photo: 'sealed' },
      { id: 'e6', at: now - 52 * H, title: 'Handed to courier', note: 'Fargo Courier · Waybill FG4821907. Receipt photo from rider.', photo: 'receipt' },
    ] },
];

const supplierThread = (s: Supplier, messages: Message[], unread = 0): ChatThread => ({
  id: `s-${s.id}`, name: s.name, role: `Supplier · ${s.market}`, unread, online: s.online, lastSeen: s.lastSeen, supplierId: s.id, messages,
});
const hello = (s: Supplier): Message[] => [{ id: uid(), from: 'them', text: `Hi! This is ${s.name}. How can we help?`, at: now - 3 * 86400000 }];
const SEED_CHATS: ChatThread[] = [
  { id: 'c1', name: 'Wanjiru', role: 'Field shopper · Gikomba', unread: 1, online: true, lastSeen: now,
    messages: [
      { id: 'm1', from: 'me', text: 'Hi, any luck with the black hoodie?', at: now - H },
      { id: 'm2', from: 'them', text: 'Found one in Gikomba, KSh 1,800. Want me to send a photo?', at: now - 1800000 },
    ] },
  supplierThread(sup('s3'), [
    { id: 'm4', from: 'them', kind: 'till', till: sup('s3').till, amount: 1200, orderId: 'o1', text: 'Pay KSh 1,200 to Till 4471290.', at: now - 125 * 60000 },
    { id: 'm5', from: 'me', kind: 'payment', orderId: 'o1', text: 'SJK2L9M4PQ Confirmed. Ksh1,200.00 paid to LUTHULI ELECTRONICS.', at: now - 120 * 60000 },
    { id: 'm6', from: 'them', text: 'Payment received ✅ Packing your order now.', at: now - 118 * 60000 },
  ]),
  supplierThread(sup('s5'), hello(sup('s5'))),
  supplierThread(sup('s2'), hello(sup('s2'))),
  { id: 'c2', name: 'GEKEL Support', role: 'We reply within minutes', unread: 0, online: true, lastSeen: now,
    messages: [{ id: 'm3', from: 'them', text: 'Karibu GEKEL! Ask us anything about your orders.', at: now - 86400000 }] },
];

/* ═════════ Provider ═════════ */
export function AppDataProvider({ children }: { children: React.ReactNode }) {
  const [requests, setRequests] = useState(SEED_REQUESTS);
  const [orders, setOrders] = useState(SEED_ORDERS);
  const [chats, setChats] = useState(SEED_CHATS);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [addresses, setAddresses] = useState(SEED_ADDRESSES);
  const [payNumbers, setPayNumbers] = useState(SEED_PAY);
  const [avatarUri, setAvatarUri] = useState<string>();
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number }>();
  const [locationDenied, setLocationDenied] = useState(false);
  const [unreadNotifications, setUnread] = useState(2);
  const [resellerMode, setResellerMode] = useState(false);

  const post = useCallback((chatId: string, msg: Omit<Message, 'id' | 'at'>, supplier?: Supplier) => {
    const m: Message = { id: uid(), at: Date.now(), ...msg };
    setChats((p) => {
      if (p.some((c) => c.id === chatId)) return p.map((c) => (c.id === chatId ? { ...c, messages: [...c.messages, m], unread: m.from === 'them' ? c.unread + 1 : c.unread } : c));
      return supplier ? [supplierThread(supplier, [m], m.from === 'them' ? 1 : 0), ...p] : p;
    });
  }, []);

  /* location */
  const requestLocation = useCallback(async () => {
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (!perm.granted) { setLocationDenied(true); return false; }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      setLocationDenied(false);
      return true;
    } catch { return false; }
  }, []);

  /* requests */
  const addRequest: Ctx['addRequest'] = useCallback((r) => {
    const id = uid();
    setRequests((p) => [{ ...r, id, stage: 0, createdAt: Date.now() }, ...p]);
    setTimeout(() => setRequests((p) => p.map((x) => (x.id === id && x.stage === 0 ? { ...x, stage: 1 } : x))), 2500); // TODO: POST /requests
    return id;
  }, []);
  const cancelRequest = useCallback((id: string) => setRequests((p) => p.map((r) => (r.id === id ? { ...r, cancelled: true } : r))), []);
  const advanceRequest = useCallback((id: string) => setRequests((p) => p.map((r) => (r.id === id ? { ...r, stage: Math.min(REQUEST_STAGES.length - 1, r.stage + 1) } : r))), []);

  /* cart */
  const addToCart = useCallback((productId: string, qty = 1) => setCart((p) => (p.some((l) => l.productId === productId) ? p.map((l) => (l.productId === productId ? { ...l, qty: l.qty + qty } : l)) : [...p, { productId, qty, selected: true }])), []);
  const setCartQty = useCallback((productId: string, qty: number) => setCart((p) => (qty < 1 ? p.filter((l) => l.productId !== productId) : p.map((l) => (l.productId === productId ? { ...l, qty } : l)))), []);
  const removeFromCart = useCallback((productId: string) => setCart((p) => p.filter((l) => l.productId !== productId)), []);
  const toggleCartSelect = useCallback((productId: string) => setCart((p) => p.map((l) => (l.productId === productId ? { ...l, selected: !l.selected } : l))), []);
  const selectAllCart = useCallback((v: boolean) => setCart((p) => p.map((l) => ({ ...l, selected: v }))), []);
  const clearOrdered = useCallback((ids: string[]) => setCart((p) => p.filter((l) => !ids.includes(l.productId))), []);

  /* addresses */
  const addAddress: Ctx['addAddress'] = useCallback((a) => {
    const id = uid();
    setAddresses((p) => { const makeDefault = a.isDefault || p.length === 0; return [...p.map((x) => (makeDefault ? { ...x, isDefault: false } : x)), { ...a, id, isDefault: makeDefault }]; });
    return id;
  }, []);
  const updateAddress = useCallback((id: string, patch: Partial<Address>) => setAddresses((p) => p.map((a) => (a.id === id ? { ...a, ...patch } : patch.isDefault ? { ...a, isDefault: false } : a))), []);
  const deleteAddress = useCallback((id: string) => setAddresses((p) => { const r = p.filter((a) => a.id !== id); return r.length && !r.some((a) => a.isDefault) ? r.map((a, i) => ({ ...a, isDefault: i === 0 })) : r; }), []);
  const setDefaultAddress = useCallback((id: string) => setAddresses((p) => p.map((a) => ({ ...a, isDefault: a.id === id }))), []);
  const defaultAddress = addresses.find((a) => a.isDefault) ?? addresses[0];

  /* payment numbers */
  const addPayNumber = useCallback((n: string) => setPayNumbers((p) => [...p, { id: uid(), number: n, isDefault: p.length === 0 }]), []);
  const removePayNumber = useCallback((id: string) => setPayNumbers((p) => { const r = p.filter((x) => x.id !== id); return r.length && !r.some((x) => x.isDefault) ? r.map((x, i) => ({ ...x, isDefault: i === 0 })) : r; }), []);
  const setDefaultPay = useCallback((id: string) => setPayNumbers((p) => p.map((x) => ({ ...x, isDefault: x.id === id }))), []);

  /* orders: one bundle = one order per shop. One delivery fee and one service fee for the whole bundle. */
  const placeBundle: Ctx['placeBundle'] = useCallback(({ lines, address, delivery, dropship }) => {
    const bundleId = uid();
    const groups = new Map<string, { productId: string; qty: number }[]>();
    lines.forEach((l) => { const sid = PRODUCTS.find((p) => p.id === l.productId)!.supplierId; groups.set(sid, [...(groups.get(sid) ?? []), l]); });
    const stops = groups.size;
    const fee = deliveryFee(delivery, stops);
    const created: Order[] = [];
    let first = true;
    groups.forEach((ls, sid) => {
      const supplier = sup(sid);
      const items: OrderItem[] = ls.map((l) => ({ productId: l.productId, qty: l.qty, unitPrice: unitPriceFor(l.productId, l.qty) }));
      const price = items.reduce((n, i) => n + i.qty * i.unitPrice, 0);
      const id = uid();
      const o: Order = {
        id, bundleId, stops, supplierId: sid, chatId: `s-${sid}`, items, price,
        deliveryFee: first ? fee : 0, serviceFee: first ? SERVICE_FEE : 0, deliveryPaid: first ? delivery.pay === 'now' : true,
        delivery, address: formatAddress(address), coords: address.lat != null ? { lat: address.lat, lng: address.lng! } : undefined, dropship,
        quote: 'pending', stage: 0, sealNo: `GKL-${Math.floor(10000 + Math.random() * 89999)}`, rider, etaMinutes: 60, createdAt: Date.now(),
        events: [{ id: uid(), at: Date.now(), title: 'Order placed', note: 'Waiting for the shop to confirm availability' }],
      };
      first = false;
      created.push(o);
      const list = items.map((i) => `${i.qty} × ${PRODUCTS.find((p) => p.id === i.productId)!.name}`).join(', ');
      const how = delivery.method === 'courier' ? `via ${delivery.courier}` : `${delivery.speed === 'express' ? 'express' : 'standard'} ${delivery.dest === 'pickup' ? 'to pickup point' : 'to door'}`;
      post(o.chatId, { from: 'me', orderId: id, text: `Hi! I'd like to order ${list}. Delivery ${how}${dropship ? ` for my customer ${dropship.name}` : ''}.` }, supplier);
      // TODO: POST /orders. The backend creates the chat message and the shop answers.
      setTimeout(() => post(o.chatId, { from: 'them', kind: 'quote', orderId: id, amount: price, text: `Yes, ${items.length > 1 ? 'all items are' : 'it is'} available ✅ Total ${'KSh ' + price.toLocaleString('en-KE')}. Shall I pack it?` }, supplier), 1300);
    });
    setOrders((p) => [...created, ...p]);
    return { bundleId, orderIds: created.map((o) => o.id), chatIds: created.map((o) => o.chatId) };
  }, [post]);

  const respondQuote: Ctx['respondQuote'] = useCallback((order, accept) => {
    const s = sup(order.supplierId);
    setOrders((p) => p.map((o) => (o.id === order.id ? { ...o, quote: accept ? 'accepted' : 'declined', cancelled: accept ? o.cancelled : true } : o)));
    post(order.chatId, { from: 'me', text: accept ? 'Yes, please pack it 👍' : 'No thanks, cancel this one.' });
    setTimeout(() => accept
      ? post(order.chatId, { from: 'them', kind: 'till', till: s.till, amount: order.price, orderId: order.id, text: `Great! Pay KSh ${order.price.toLocaleString('en-KE')} to Till ${s.till}, or get an M-Pesa prompt on your phone.` })
      : post(order.chatId, { from: 'them', text: 'No problem, see you next time 👋' }), 900);
  }, [post]);

  const confirmPaid = (orderId: string, chatId: string) => {
    post(chatId, { from: 'them', text: 'Payment received ✅ Packing your order now.' });
    setOrders((p) => p.map((x) => (x.id === orderId && x.stage === 0 ? advance(x) : x)));
  };
  const payWithPrompt: Ctx['payWithPrompt'] = useCallback((order, phone) => {
    post(order.chatId, { from: 'me', text: `Please send the M-Pesa prompt to ${phone}.` });
    setOrders((p) => p.map((o) => (o.id === order.id ? { ...o, paymentNote: `M-Pesa prompt to ${phone}` } : o)));
    // TODO: POST /payments/mpesa/stk-push. Confirm from the callback, not a timer.
    setTimeout(() => post(order.chatId, { from: 'them', text: `Prompt sent to ${phone}. Enter your M-Pesa PIN to pay.` }), 900);
    setTimeout(() => confirmPaid(order.id, order.chatId), 4200);
  }, [post]); // eslint-disable-line react-hooks/exhaustive-deps

  const attachPayment: Ctx['attachPayment'] = useCallback((orderId, chatId, proof) => {
    post(chatId, { from: 'me', kind: 'payment', orderId, text: proof.text?.trim() || 'Payment screenshot attached', imageUri: proof.imageUri });
    setOrders((p) => p.map((x) => (x.id === orderId ? { ...x, paymentNote: proof.text } : x)));
    setTimeout(() => confirmPaid(orderId, chatId), 1800); // TODO: POST /orders/:id/payment-proof
  }, [post]); // eslint-disable-line react-hooks/exhaustive-deps

  const advanceOrder = useCallback((id: string) => setOrders((p) => p.map((o) => (o.id === id ? advance(o) : o))), []);
  const advanceCourier = useCallback((id: string) => setOrders((p) => p.map((o) => {
    if (o.id !== id || !o.courier) return o;
    const script = courierScript(o.address.split(',').slice(-2)[0]?.trim() || 'your town');
    const next = o.courier.events.length;
    if (next >= script.length) return advance(o);
    return { ...o, courier: { ...o.courier, events: [...o.courier.events, { id: uid(), at: Date.now(), text: script[next] }] } };
  })), []);
  const confirmReceived = useCallback((id: string) => setOrders((p) => p.map((o) => {
    if (o.id !== id || o.stage >= DELIVERED) return o;
    return { ...advance(o), events: [...o.events, { id: uid(), at: Date.now(), title: 'Delivered', note: 'Confirmed received by you', photo: 'delivery' as const }] };
  })), []);
  const rateOrder = useCallback((id: string, r: { supplier: number; rider: number }) => setOrders((p) => p.map((o) => (o.id === id ? { ...o, rating: r } : o))), []); // TODO: POST /ratings

  const toggleFavorite = useCallback((pid: string) => setFavorites((p) => (p.includes(pid) ? p.filter((x) => x !== pid) : [...p, pid])), []);
  const openSupplierChat = useCallback((supplierId: string) => {
    const s = sup(supplierId); const id = `s-${s.id}`;
    setChats((p) => (p.some((c) => c.id === id) ? p : [supplierThread(s, [{ id: uid(), from: 'them', text: `Hi! This is ${s.name}. How can we help?`, at: Date.now() }]), ...p]));
    return id;
  }, []);
  const sendMessage = useCallback((chatId: string, text: string, imageUri?: string) => {
    post(chatId, { from: 'me', text, imageUri });
    setTimeout(() => post(chatId, { from: 'them', text: replyFor(text) }), 1400); // TODO: websocket / push
  }, [post]);
  const markChatRead = useCallback((chatId: string) => setChats((p) => p.map((c) => (c.id === chatId && c.unread ? { ...c, unread: 0 } : c))), []);
  const markNotificationsRead = useCallback(() => setUnread(0), []);

  const value = useMemo<Ctx>(() => ({
    requests, orders, chats, favorites, cart, addresses, defaultAddress, payNumbers, avatarUri, userCoords, locationDenied, unreadNotifications, resellerMode,
    setResellerMode, setAvatarUri, requestLocation, addRequest, cancelRequest, advanceRequest, addToCart, setCartQty, removeFromCart, toggleCartSelect, selectAllCart, clearOrdered,
    addAddress, updateAddress, deleteAddress, setDefaultAddress, addPayNumber, removePayNumber, setDefaultPay, placeBundle, respondQuote, payWithPrompt, attachPayment,
    confirmReceived, rateOrder, advanceOrder, advanceCourier, toggleFavorite, openSupplierChat, sendMessage, markChatRead, markNotificationsRead,
  }), [requests, orders, chats, favorites, cart, addresses, defaultAddress, payNumbers, avatarUri, userCoords, locationDenied, unreadNotifications, resellerMode,
    requestLocation, addRequest, cancelRequest, advanceRequest, addToCart, setCartQty, removeFromCart, toggleCartSelect, selectAllCart, clearOrdered, addAddress, updateAddress,
    deleteAddress, setDefaultAddress, addPayNumber, removePayNumber, setDefaultPay, placeBundle, respondQuote, payWithPrompt, attachPayment, confirmReceived, rateOrder,
    advanceOrder, advanceCourier, toggleFavorite, openSupplierChat, sendMessage, markChatRead, markNotificationsRead]);

  return <AppData.Provider value={value}>{children}</AppData.Provider>;
}

export const useAppData = () => {
  const c = useContext(AppData);
  if (!c) throw new Error('useAppData must be used inside <AppDataProvider>');
  return c;
};
