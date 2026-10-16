import React, { useState } from 'react';
import { Alert, FlatList, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../../components/Screen';
import BackHeader from '../../components/BackHeader';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { useAppData } from '../../context/AppDataContext';
import { isKenyanPhone } from '../../utils/validation';

export default function PaymentsScreen() {
  const { payNumbers, addPayNumber, removePayNumber, setDefaultPay } = useAppData();
  const [n, setN] = useState('');
  const [err, setErr] = useState<string>();

  const add = () => {
    if (!isKenyanPhone(n)) return setErr('Enter a valid Safaricom or Airtel number');
    addPayNumber(n.replace(/[\s-]/g, '')); setN(''); setErr(undefined);
  };

  return (
    <Screen>
      <BackHeader title="M-Pesa numbers" />
      <Text className="mb-4 mt-4 text-sm leading-5 text-ink-soft">Your default number gets the M-Pesa prompt when you choose "Send me a prompt" in chat or pay the delivery fee.</Text>
      <FlatList
        data={payNumbers} keyExtractor={(p) => p.id} showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View className="mb-3 flex-row items-center rounded-2xl border border-line bg-white p-4">
            <View className="h-10 w-10 items-center justify-center rounded-full bg-green-50"><Ionicons name="phone-portrait" size={19} color="#15803D" /></View>
            <View className="ml-3 flex-1"><Text className="text-base font-bold text-ink">{item.number}</Text>{item.isDefault ? <Text className="text-xs font-semibold text-brand-600">Default</Text> : <Pressable hitSlop={8} onPress={() => setDefaultPay(item.id)}><Text className="text-xs font-semibold text-ink-soft">Set as default</Text></Pressable>}</View>
            <Pressable hitSlop={10} onPress={() => Alert.alert('Remove number?', item.number, [{ text: 'Cancel', style: 'cancel' }, { text: 'Remove', style: 'destructive', onPress: () => removePayNumber(item.id) }])}><Ionicons name="trash-outline" size={20} color={ic.faint} /></Pressable>
          </View>
        )}
        ListFooterComponent={
          <View className="mt-3">
            <Input label="Add a number" icon="call-outline" placeholder="0712 345 678" keyboardType="phone-pad" value={n} onChangeText={(t) => { setN(t); setErr(undefined); }} error={err} returnKeyType="done" onSubmitEditing={add} />
            <Button title="Add number" variant="outline" onPress={add} />
          </View>
        }
      />
    </Screen>
  );
}
