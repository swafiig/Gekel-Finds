import React, { useState } from 'react';
import { Alert, Image, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import Screen from '../../components/Screen';
import BackHeader from '../../components/BackHeader';
import Input from '../../components/Input';
import Button from '../../components/Button';
import Chip from '../../components/Chip';
import { useAppData } from '../../context/AppDataContext';
import { CATEGORIES } from '../../data/mock';
import { useNav } from '../../hooks/useNav';

export default function AskGekelScreen() {
  const nav = useNav();
  const { addRequest } = useAppData();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<string>();
  const [budget, setBudget] = useState('');
  const [urgency, setUrgency] = useState<'sameDay' | 'standard'>('standard');
  const [photo, setPhoto] = useState<string>();
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);

  const pick = async (camera: boolean) => {
    const perm = camera ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return Alert.alert('Permission needed', `Allow ${camera ? 'camera' : 'photo'} access in Settings to add a picture.`);
    const res = camera
      ? await ImagePicker.launchCameraAsync({ quality: 0.7 })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 });
    if (!res.canceled) setPhoto(res.assets[0].uri);
  };

  const choosePhoto = () =>
    Alert.alert('Add a picture', undefined, [
      { text: 'Take photo', onPress: () => pick(true) },
      { text: 'Choose from gallery', onPress: () => pick(false) },
      { text: 'Cancel', style: 'cancel' },
    ]);

  const submit = async () => {
    if (title.trim().length < 3 && !photo) return setError('Describe what you need or add a picture');
    setLoading(true);
    // TODO: upload photo + POST /requests
    const id = addRequest({
      title: title.trim() || 'Item from photo', category,
      budget: budget ? Number(budget.replace(/\D/g, '')) : undefined, urgency, photoUri: photo,
    });
    setLoading(false);
    nav.replace('RequestDetail', { id });
  };

  return (
    <Screen scroll>
      <BackHeader title="Ask GEKEL" />
      <Text className="mb-6 mt-4 text-base leading-6 text-ink-soft">
        Tell us what you need or upload a picture. We find it, confirm the price, then you decide.
      </Text>

      <Text className="mb-1.5 text-sm font-medium text-ink">What do you need?</Text>
      <View className={`mb-4 min-h-[96px] rounded-2xl border bg-white px-4 py-3 ${error ? 'border-danger' : 'border-line'}`}>
        <TextInput
          multiline
          className="text-base text-ink"
          style={{ minHeight: 70, textAlignVertical: 'top' }}
          placeholder="Black hoodie, size L, plain with no logo"
          placeholderTextColor="#A8A29E"
          value={title}
          onChangeText={(t) => { setTitle(t); setError(undefined); }}
        />
      </View>
      {error && <Text className="-mt-2 mb-3 text-sm text-danger">{error}</Text>}

      {photo ? (
        <View className="mb-5 h-40 overflow-hidden rounded-2xl">
          <Image source={{ uri: photo }} className="h-full w-full" resizeMode="cover" />
          <Pressable onPress={() => setPhoto(undefined)} className="absolute right-2 top-2 h-8 w-8 items-center justify-center rounded-full bg-black/60" accessibilityLabel="Remove photo">
            <Ionicons name="close" size={18} color="#fff" />
          </Pressable>
        </View>
      ) : (
        <Pressable onPress={choosePhoto} accessibilityLabel="Add a picture" className="mb-5 h-28 items-center justify-center rounded-2xl border border-dashed border-brand-400 bg-brand-50 active:opacity-80">
          <Ionicons name="camera" size={26} color="#E8590C" />
          <Text className="mt-1.5 text-sm font-semibold text-brand-600">Add a picture</Text>
        </Pressable>
      )}

      <Text className="mb-2 text-sm font-medium text-ink">Category</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-5 -mx-6" contentContainerStyle={{ paddingHorizontal: 24 }}>
        {CATEGORIES.map((c) => <Chip key={c} label={c} active={category === c} onPress={() => setCategory(category === c ? undefined : c)} />)}
      </ScrollView>

      <Input label="Budget (KSh, optional)" icon="cash-outline" placeholder="2000" keyboardType="number-pad" value={budget} onChangeText={setBudget} />

      <Text className="mb-2 text-sm font-medium text-ink">When do you need it?</Text>
      <View className="mb-6 flex-row gap-3">
        {([['sameDay', 'Same day', 'flash'], ['standard', 'Within 3 days', 'calendar-outline']] as const).map(([k, l, ic]) => (
          <Pressable key={k} onPress={() => setUrgency(k)} accessibilityState={{ selected: urgency === k }}
            className={`h-14 flex-1 flex-row items-center justify-center rounded-2xl border ${urgency === k ? 'border-brand-500 bg-brand-50' : 'border-line bg-white'}`}>
            <Ionicons name={ic} size={16} color={urgency === k ? '#E8590C' : '#A8A29E'} />
            <Text className={`ml-2 text-sm font-semibold ${urgency === k ? 'text-brand-600' : 'text-ink-soft'}`}>{l}</Text>
          </Pressable>
        ))}
      </View>

      <Button title="Send request" onPress={submit} loading={loading} />
    </Screen>
  );
}
