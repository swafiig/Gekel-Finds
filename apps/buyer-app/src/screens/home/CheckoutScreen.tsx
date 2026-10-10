import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useRoute } from '@react-navigation/native';
import Screen from '../../components/Screen';
import BackHeader from '../../components/BackHeader';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { useAuth } from '../../context/AuthContext';
import { formatAddress, unitPriceFor, useAppData } from '../../context/AppDataContext';
import { COURIERS, DeliveryChoice, PICKUP_POINTS, PRODUCTS, SERVICE_FEE, SUPPLIERS, deliveryFee, formatKsh } from '../../data/mock';
import { isKenyanPhone } from '../../utils/validation';
import { useNav } from '../../hooks/useNav';
import type { RootStackParamList } from '../../types/navigation';

type Errors = Partial<Record<'address' | 'phone' | 'cName' | 'cPhone', string>>;

function Option({ active, title, body, icon, price, onPress }: { active: boolean; title: string; body: string; icon: keyof typeof Ionicons.glyphMap; price?: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="radio" accessibilityState={{ selected: active }} className={`mb-3 flex-row items-center rounded-2xl border p-3.5 ${active ? 'border-brand-500 bg-brand-50' : 'border-line bg-white'}`}>
      <View className={`h-10 w-10 items-center justify-center rounded-full ${active ? 'bg-brand-500' : 'bg-cream'}`}><Ionicons name={icon} size={20} color={active ? '#fff' : '#57534E'} /></View>
      <View className="ml-3 flex-1"><Text className="text-base font-bold text-ink">{title}</Text><Text className="text-sm leading-5 text-ink-soft">{body}</Text></View>
      {price ? <Text className="ml-2 text-sm font-extrabold text-ink">{price}</Text> : null}
    </Pressable>
  );
}
const H = ({ children }: { children: string }) => <Text className="mb-3 mt-5 text-lg font-extrabold text-ink">{children}</Text>;

export default function CheckoutScreen() {
  const nav = useNav();
  const { lines, fromCart } = useRoute<RouteProp<RootStackParamList, 'Checkout'>>().params;
  const { user } = useAuth();
  const { addresses, defaultAddress, payNumbers, placeBundle, clearOrdered, resellerMode } = useAppData();

  const shops = useMemo(() => new Set(lines.map((l) => PRODUCTS.find((p) => p.id === l.productId)!.supplierId)), [lines]);
  const stops = shops.size;
  const items = lines.reduce((n, l) => n + unitPriceFor(l.productId, l.qty) * l.qty, 0);

  const [addrId, setAddrId] = useState(defaultAddress?.id);
  const address = addresses.find((a) => a.id === addrId);
  const nairobi = !address || address.county === 'Nairobi';
  const [speed, setSpeed] = useState<'standard' | 'express'>('standard');
  const [dest, setDest] = useState<'door' | 'pickup'>('door');
  const [pickupPoint, setPickupPoint] = useState(PICKUP_POINTS[0]);
  const [courier, setCourier] = useState(COURIERS[0]);
  const [pay, setPay] = useState<'now' | 'later'>('later');
  const [shipTo, setShipTo] = useState<'me' | 'customer'>(resellerMode ? 'customer' : 'me');
  const [cName, setCName] = useState('');
  const [cPhone, setCPhone] = useState('');
  const [phone, setPhone] = useState(payNumbers.find((p) => p.isDefault)?.number ?? user?.phone ?? '');
  const [errors, setErrors] = useState<Errors>({});
  const [waiting, setWaiting] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  const clear = (k: keyof Errors) => setErrors((p) => ({ ...p, [k]: undefined }));

  const delivery: DeliveryChoice = nairobi
    ? { method: 'rider', speed, dest, pickupPoint: dest === 'pickup' ? pickupPoint : undefined, pay }
    : { method: 'courier', speed: 'standard', dest, courier, pay };
  const dFee = deliveryFee(delivery, stops);
  const fees = dFee + SERVICE_FEE;
  const fee = (s: 'standard' | 'express', d: 'door' | 'pickup') => formatKsh(deliveryFee({ method: 'rider', speed: s, dest: d, pay }, stops));

  const place = () => {
    if (!address) return;
    const r = placeBundle({ lines, address, delivery, dropship: shipTo === 'customer' ? { name: cName.trim(), phone: cPhone.replace(/[\s-]/g, '') } : undefined });
    if (fromCart) clearOrdered(lines.map((l) => l.productId));
    if (stops > 1) nav.replace('Bundle', { id: r.bundleId }); else nav.replace('ChatRoom', { id: r.chatIds[0] });
  };

  const submit = () => {
    const e: Errors = {};
    if (!address) e.address = 'Choose or add a delivery address';
    if (shipTo === 'customer') {
      if (cName.trim().length < 2) e.cName = "Enter your customer's name";
      if (!isKenyanPhone(cPhone)) e.cPhone = "Enter your customer's phone number";
    }
    if (pay === 'now' && !isKenyanPhone(phone)) e.phone = 'Enter your M-Pesa number, e.g. 0712 345 678';
    setErrors(e);
    if (Object.keys(e).length) return;
    if (pay === 'now') { setWaiting(true); timer.current = setTimeout(place, 3200); } // TODO: STK push for `fees`, place on success
    else place();
  };

  if (waiting) {
    return (
      <Screen>
        <View className="flex-1 items-center justify-center px-4">
          <View className="mb-6 h-24 w-24 items-center justify-center rounded-full bg-green-50"><Ionicons name="phone-portrait" size={44} color="#15803D" /></View>
          <Text className="text-center text-2xl font-extrabold text-ink">Check your phone</Text>
          <Text className="mt-2 text-center text-base leading-6 text-ink-soft">Enter your M-Pesa PIN to pay {formatKsh(fees)} (delivery and service fee) to GEKEL. We never see your PIN.</Text>
          <ActivityIndicator color="#F44236" style={{ marginTop: 28 }} />
        </View>
        <Button title="Cancel" variant="outline" onPress={() => { if (timer.current) clearTimeout(timer.current); setWaiting(false); }} />
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <BackHeader title="Checkout" />

      {/* items */}
      <View className="mt-4 rounded-2xl border border-line bg-white p-4">
        <View className="flex-row items-center justify-between"><Text className="text-base font-bold text-ink">{lines.length} item{lines.length === 1 ? '' : 's'} · {stops} shop{stops === 1 ? '' : 's'}</Text><Text className="text-base font-extrabold text-ink">{formatKsh(items)}</Text></View>
        {[...shops].map((sid) => (
          <Text key={sid} numberOfLines={1} className="mt-1.5 text-sm text-ink-soft">{SUPPLIERS.find((s) => s.id === sid)!.name}: {lines.filter((l) => PRODUCTS.find((p) => p.id === l.productId)!.supplierId === sid).map((l) => `${l.qty} × ${PRODUCTS.find((p) => p.id === l.productId)!.name}`).join(', ')}</Text>
        ))}
        {stops > 1 && <View className="mt-3 flex-row items-center rounded-xl bg-brand-50 p-2.5"><Ionicons name="git-merge" size={16} color="#F44236" /><Text className="ml-2 flex-1 text-xs text-ink">Combined: one delivery for all {stops} shops. Each shop is paid separately in chat.</Text></View>}
      </View>

      {/* address */}
      <H>Deliver to</H>
      {addresses.map((a) => (
        <Pressable key={a.id} onPress={() => { setAddrId(a.id); clear('address'); }} accessibilityRole="radio" accessibilityState={{ selected: a.id === addrId }} className={`mb-3 flex-row items-center rounded-2xl border p-3.5 ${a.id === addrId ? 'border-brand-500 bg-brand-50' : 'border-line bg-white'}`}>
          <Ionicons name={a.label === 'Home' ? 'home' : a.label === 'Work' ? 'briefcase' : 'location'} size={20} color={a.id === addrId ? '#F44236' : '#57534E'} />
          <View className="ml-3 flex-1"><Text className="text-base font-bold text-ink">{a.label} · {a.area}</Text><Text numberOfLines={2} className="text-sm text-ink-soft">{formatAddress(a)}</Text></View>
          {a.id === addrId && <Ionicons name="checkmark-circle" size={20} color="#F44236" />}
        </Pressable>
      ))}
      <Pressable onPress={() => nav.navigate('AddressForm', {})} className="mb-1 h-12 flex-row items-center justify-center rounded-2xl border border-dashed border-brand-400 bg-brand-50"><Ionicons name="add" size={18} color="#F44236" /><Text className="ml-1 text-sm font-bold text-brand-600">Add address (GPS or map pin)</Text></Pressable>
      {errors.address && <Text className="mt-1 text-sm text-danger">{errors.address}</Text>}

      {/* who */}
      <H>Who receives it?</H>
      <Option active={shipTo === 'me'} icon="person-outline" title="Me" body="Delivered to the address above" onPress={() => setShipTo('me')} />
      <Option active={shipTo === 'customer'} icon="people-outline" title="My customer (drop-ship)" body="For online sellers: we deliver straight to your buyer" onPress={() => setShipTo('customer')} />
      {shipTo === 'customer' && (
        <>
          <Input label="Customer name" icon="person-outline" placeholder="Jane Wambui" autoCapitalize="words" value={cName} onChangeText={(t) => { setCName(t); clear('cName'); }} error={errors.cName} />
          <Input label="Customer phone" icon="call-outline" placeholder="0712 345 678" keyboardType="phone-pad" value={cPhone} onChangeText={(t) => { setCPhone(t); clear('cPhone'); }} error={errors.cPhone} />
        </>
      )}

      {/* delivery method */}
      <H>{nairobi ? 'How fast?' : 'Courier'}</H>
      {nairobi ? (
        <>
          <Option active={speed === 'standard'} icon="bicycle" title="Standard" body="GEKEL rider, same day or next day. Cheapest." price={fee('standard', dest)} onPress={() => setSpeed('standard')} />
          <Option active={speed === 'express'} icon="flash" title="Express" body={stops > 1 ? `One rider collects from all ${stops} shops and comes straight to you.` : 'A rider goes from the shop straight to you. No stops, no sorting.'} price={fee('express', dest)} onPress={() => setSpeed('express')} />
          <H>Door or pickup point?</H>
          <Option active={dest === 'door'} icon="home-outline" title="To my door" body="Rider brings it to your address" onPress={() => setDest('door')} />
          <Option active={dest === 'pickup'} icon="location-outline" title="Pickup point" body="Collect from a GEKEL point. KSh 50 cheaper." onPress={() => setDest('pickup')} />
          {dest === 'pickup' && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-6 mb-3" contentContainerStyle={{ paddingHorizontal: 24, gap: 8 }}>
              {PICKUP_POINTS.map((p) => (
                <Pressable key={p} onPress={() => setPickupPoint(p)} className={`h-10 justify-center rounded-full border px-4 ${pickupPoint === p ? 'border-brand-500 bg-brand-500' : 'border-line bg-white'}`}><Text className={`text-sm font-semibold ${pickupPoint === p ? 'text-white' : 'text-ink-soft'}`}>{p}</Text></Pressable>
              ))}
            </ScrollView>
          )}
        </>
      ) : (
        <>
          <View className="mb-3 flex-row items-start rounded-2xl bg-amber-50 p-3"><Ionicons name="information-circle" size={18} color="#B7791F" style={{ marginTop: 1 }} /><Text className="ml-2 flex-1 text-sm leading-5 text-amber-900">{address?.town} is outside Nairobi. A GEKEL rider takes your parcel to the courier, uploads the receipt and gives you the waybill number to track it. Takes 1 to 3 working days.</Text></View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-6 mb-3" contentContainerStyle={{ paddingHorizontal: 24, gap: 8 }}>
            {COURIERS.map((c) => <Pressable key={c} onPress={() => setCourier(c)} className={`h-10 justify-center rounded-full border px-4 ${courier === c ? 'border-brand-500 bg-brand-500' : 'border-line bg-white'}`}><Text className={`text-sm font-semibold ${courier === c ? 'text-white' : 'text-ink-soft'}`}>{c}</Text></Pressable>)}
          </ScrollView>
          <Option active={dest === 'door'} icon="home-outline" title="Courier to my door" body={`${courier} delivers to your address`} price={formatKsh(deliveryFee({ ...delivery, dest: 'door' }, stops))} onPress={() => setDest('door')} />
          <Option active={dest === 'pickup'} icon="business-outline" title="Collect at courier office" body="Cheaper. They call you when it arrives." price={formatKsh(deliveryFee({ ...delivery, dest: 'pickup' }, stops))} onPress={() => setDest('pickup')} />
          <Text className="mb-2 text-xs text-ink-mute">The courier will call {address?.phone}. Keep that line on.</Text>
        </>
      )}

      {/* fee payment */}
      <H>Delivery fee payment</H>
      <Option active={pay === 'later'} icon="cash-outline" title={nairobi ? 'Pay on delivery' : 'Pay at collection'} body={nairobi ? 'Pay the rider when it arrives' : 'Pay the courier when you collect or receive'} onPress={() => setPay('later')} />
      <Option active={pay === 'now'} icon="phone-portrait-outline" title="Pay now with M-Pesa" body="Prepay and skip the cash at the door" onPress={() => setPay('now')} />
      {pay === 'now' && <Input label="M-Pesa number" icon="call-outline" placeholder="0712 345 678" keyboardType="phone-pad" value={phone} onChangeText={(t) => { setPhone(t); clear('phone'); }} error={errors.phone} />}

      {/* summary */}
      <View className="my-4 rounded-2xl bg-cream p-4">
        <Line label="Items (paid to each shop's Till)" value={formatKsh(items)} />
        <Line label={`Delivery · ${delivery.method === 'courier' ? delivery.courier : delivery.speed === 'express' ? 'Express' : 'Standard'}${stops > 1 ? ` · ${stops} stops` : ''}`} value={formatKsh(dFee)} />
        <Line label="GEKEL service fee" value={formatKsh(SERVICE_FEE)} />
        <View className="my-2 h-px bg-line" />
        <Line label="Total" value={formatKsh(items + fees)} bold />
        <Text className="mt-2 text-xs text-ink-mute">{pay === 'now' ? `Pay ${formatKsh(fees)} to GEKEL now. Items are paid to each shop in chat.` : `Fees are paid on ${nairobi ? 'delivery' : 'collection'}. Items are paid to each shop in chat.`}</Text>
      </View>

      <View className="mb-5 flex-row items-start rounded-2xl bg-brand-50 p-3">
        <Ionicons name="chatbubbles" size={18} color="#F44236" style={{ marginTop: 1 }} />
        <Text className="ml-3 flex-1 text-sm leading-5 text-ink">Next, each shop confirms availability in chat. You say OK, then pay with an M-Pesa prompt or to their Till.</Text>
      </View>

      <Button title={pay === 'now' ? `Pay ${formatKsh(fees)} & place order` : 'Place order'} onPress={submit} />
    </Screen>
  );
}

const Line = ({ label, value, bold }: { label: string; value: string; bold?: boolean }) => (
  <View className="flex-row items-center justify-between py-1"><Text className={`flex-1 pr-3 text-sm ${bold ? 'font-bold text-ink' : 'text-ink-soft'}`}>{label}</Text><Text className={`${bold ? 'text-base font-extrabold' : 'text-sm font-semibold'} text-ink`}>{value}</Text></View>
);
