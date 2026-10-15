import React, { useState } from 'react';
import { Alert, Image, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { RouteProp, useRoute } from '@react-navigation/native';
import Screen from '../../components/Screen';
import BackHeader from '../../components/BackHeader';
import Button from '../../components/Button';
import Chip from '../../components/Chip';
import { useAppData } from '../../context/AppDataContext';
import { useNav } from '../../hooks/useNav';
import type { RootStackParamList } from '../../types/navigation';

const REASONS = ['Wrong item', 'Damaged / faulty', 'Not as described', 'Changed my mind', 'Other'];

export default function ReturnRequestScreen() {
  const nav = useNav();
  const { orderId } = useRoute<RouteProp<RootStackParamList, 'ReturnRequest'>>().params;
  const { orders, requestReturn } = useAppData();
  const order = orders.find((o) => o.id === orderId)!;
  const [reason, setReason] = useState<string>();
  const [details, setDetails] = useState('');
  const [photo, setPhoto] = useState<string>();
  const [error, setError] = useState<string>();

  const addPhoto = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return Alert.alert('Permission needed', 'Allow photo access in Settings.');
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 });
    if (!r.canceled) setPhoto(r.assets[0].uri);
  };

  const submit = () => {
    if (!reason) return setError('Choose a reason');
    requestReturn(orderId, `${reason}${details ? ' — ' + details.trim() : ''}`, photo);
    Alert.alert('Sent to the supplier', 'Talk it through in chat. Once they agree, you can book a pickup.', [{ text: 'OK', onPress: () => nav.goBack() }]);
  };

  return (
    <Screen scroll>
      <BackHeader title="Request a return" />
      <Text className="mb-5 mt-3 text-sm leading-5 text-ink-soft dark:text-sink-soft">
        This order's return window is 3 days from delivery. Tell the supplier why — a clear reason and a photo make it quick for them to agree.
      </Text>

      <Text className="mb-2 text-sm font-medium text-ink dark:text-sink">Reason</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-6 mb-4" contentContainerStyle={{ paddingHorizontal: 24 }}>
        {REASONS.map((r) => <Chip key={r} label={r} active={reason === r} onPress={() => { setReason(r); setError(undefined); }} />)}
      </ScrollView>

      <Text className="mb-1.5 text-sm font-medium text-ink dark:text-sink">More details (optional)</Text>
      <View className="mb-4 min-h-[88px] rounded-2xl border border-line dark:border-surface-line bg-white dark:bg-surface px-4 py-3">
        <TextInput multiline value={details} onChangeText={setDetails} placeholder="What's wrong, exactly?" placeholderTextColor="#A8A29E" className="text-base text-ink dark:text-sink" style={{ minHeight: 64, textAlignVertical: 'top' }} />
      </View>

      {photo ? (
        <View className="mb-5 h-40 overflow-hidden rounded-2xl"><Image source={{ uri: photo }} className="h-full w-full" resizeMode="cover" /><Pressable onPress={() => setPhoto(undefined)} className="absolute right-2 top-2 h-8 w-8 items-center justify-center rounded-full bg-black-60"><Ionicons name="close" size={18} color="#fff" /></Pressable></View>
      ) : (
        <Pressable onPress={addPhoto} className="mb-5 h-24 flex-row items-center justify-center rounded-2xl border border-dashed border-brand-400 bg-brand-50"><Ionicons name="camera" size={22} color="#F44236" /><Text className="ml-2 text-sm font-semibold text-brand-600">Add a photo</Text></Pressable>
      )}
      {error && <Text className="-mt-3 mb-4 text-sm text-danger">{error}</Text>}

      <Button title="Send to supplier" onPress={submit} />
    </Screen>
  );
}
