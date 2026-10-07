import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useRoute } from '@react-navigation/native';
import Screen from '../../components/Screen';
import BackHeader from '../../components/BackHeader';
import Input from '../../components/Input';
import Button from '../../components/Button';
import ProductImage from '../../components/ProductImage';
import { useAuth } from '../../context/AuthContext';
import { useAppData } from '../../context/AppDataContext';
import { DELIVERY_FEE, PRODUCTS, formatKsh } from '../../data/mock';
import { isKenyanPhone } from '../../utils/validation';
import { useNav } from '../../hooks/useNav';
import type { RootStackParamList } from '../../types/navigation';

type Step = 'review' | 'waiting' | 'done';

export default function CheckoutScreen() {
  const nav = useNav();
  const { productId } = useRoute<RouteProp<RootStackParamList, 'Checkout'>>().params;
  const { user } = useAuth();
  const { placeOrder } = useAppData();
  const product = PRODUCTS.find((p) => p.id === productId)!;
  const total = product.price + DELIVERY_FEE;

  const [phone, setPhone] = useState(user?.phone ?? '');
  const [address, setAddress] = useState('');
  const [errors, setErrors] = useState<{ phone?: string; address?: string }>({});
  const [step, setStep] = useState<Step>('review');
  const [orderId, setOrderId] = useState<string>();
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const pay = () => {
    const e: typeof errors = {};
    if (!isKenyanPhone(phone)) e.phone = 'Enter your M-Pesa number, e.g. 0712 345 678';
    if (address.trim().length < 3) e.address = 'Where should we deliver? e.g. Kilimani, Argwings Kodhek Rd';
    setErrors(e);
    if (Object.keys(e).length) return;
    setStep('waiting');
    // TODO: POST /payments/mpesa/stk-push and listen for the callback / poll status
    timer.current = setTimeout(() => { setOrderId(placeOrder(productId)); setStep('done'); }, 3500);
  };

  const cancelWait = () => { if (timer.current) clearTimeout(timer.current); setStep('review'); };

  if (step === 'waiting') {
    return (
      <Screen>
        <View className="flex-1 items-center justify-center px-4">
          <View className="mb-6 h-24 w-24 items-center justify-center rounded-full bg-green-50"><Ionicons name="phone-portrait" size={44} color="#15803D" /></View>
          <Text className="text-center text-2xl font-extrabold text-ink">Check your phone</Text>
          <Text className="mt-2 text-center text-base leading-6 text-ink-soft">
            Enter your M-Pesa PIN to pay {formatKsh(product.price)} to the supplier's Till. We never see your PIN.
          </Text>
          <ActivityIndicator color="#E8590C" style={{ marginTop: 28 }} />
        </View>
        <Button title="Cancel" variant="outline" onPress={cancelWait} />
      </Screen>
    );
  }

  if (step === 'done') {
    return (
      <Screen>
        <View className="flex-1 items-center justify-center px-4">
          <View className="mb-6 h-24 w-24 items-center justify-center rounded-full bg-green-100"><Ionicons name="checkmark-circle" size={64} color="#15803D" /></View>
          <Text className="text-center text-2xl font-extrabold text-ink">Payment received</Text>
          <Text className="mt-2 text-center text-base leading-6 text-ink-soft">
            Your {product.name} is being packed and sealed. You can track your rider live.
          </Text>
        </View>
        <Button title="Track order" onPress={() => nav.replace('OrderDetail', { id: orderId! })} />
        <Button title="Back to home" variant="ghost" className="mt-2" onPress={() => nav.popToTop()} />
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <BackHeader title="Checkout" />
      <View className="mt-4 flex-row items-center rounded-2xl border border-line bg-white p-3">
        <View className="h-16 w-16 overflow-hidden rounded-xl"><ProductImage product={product} height={64} artSize={44} /></View>
        <View className="ml-3 flex-1">
          <Text className="text-base font-bold text-ink">{product.name}</Text>
          <Text className="text-sm text-ink-soft">{product.category}</Text>
        </View>
        <Text className="text-base font-extrabold text-ink">{formatKsh(product.price)}</Text>
      </View>

      <Text className="mb-3 mt-6 text-lg font-bold text-ink">Delivery & payment</Text>
      <Input label="Delivery address" icon="location-outline" placeholder="Estate, street, landmark" autoCapitalize="sentences"
        value={address} onChangeText={(t) => { setAddress(t); setErrors((p) => ({ ...p, address: undefined })); }} error={errors.address} />
      <Input label="M-Pesa number" icon="call-outline" placeholder="0712 345 678" keyboardType="phone-pad"
        value={phone} onChangeText={(t) => { setPhone(t); setErrors((p) => ({ ...p, phone: undefined })); }} error={errors.phone}
        hint="We send a payment prompt to this number" />

      <View className="mb-5 rounded-2xl bg-cream p-4">
        <Line label="Item (to supplier's Till)" value={formatKsh(product.price)} />
        <Line label="Delivery fee (GEKEL)" value={formatKsh(DELIVERY_FEE)} />
        <View className="my-2 h-px bg-line" />
        <Line label="Total" value={formatKsh(total)} bold />
      </View>

      <View className="mb-5 flex-row items-start rounded-2xl bg-brand-50 p-3">
        <Ionicons name="shield-checkmark" size={18} color="#E8590C" style={{ marginTop: 1 }} />
        <Text className="ml-3 flex-1 text-sm leading-5 text-ink">You pay the supplier directly with zero markup. You confirm the goods on delivery.</Text>
      </View>

      <Button title={`Pay ${formatKsh(total)} with M-Pesa`} onPress={pay} />
    </Screen>
  );
}

const Line = ({ label, value, bold }: { label: string; value: string; bold?: boolean }) => (
  <View className="flex-row items-center justify-between py-1">
    <Text className={`text-sm ${bold ? 'font-bold text-ink' : 'text-ink-soft'}`}>{label}</Text>
    <Text className={`${bold ? 'text-base font-extrabold' : 'text-sm font-semibold'} text-ink`}>{value}</Text>
  </View>
);
