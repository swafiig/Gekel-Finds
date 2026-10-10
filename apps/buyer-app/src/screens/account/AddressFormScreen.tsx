import React, { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, Switch, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { RouteProp, useRoute } from '@react-navigation/native';
import Screen from '../../components/Screen';
import BackHeader from '../../components/BackHeader';
import Input from '../../components/Input';
import Button from '../../components/Button';
import Chip from '../../components/Chip';
import { useAuth } from '../../context/AuthContext';
import { Address, useAppData } from '../../context/AppDataContext';
import { COUNTIES } from '../../data/mock';
import { isKenyanPhone } from '../../utils/validation';
import { useNav } from '../../hooks/useNav';
import type { RootStackParamList } from '../../types/navigation';

type Errors = Partial<Record<'area' | 'unit' | 'phone', string>>;
const mapCounty = (r?: string | null) => (r && COUNTIES.find((c) => r.toLowerCase().includes(c.toLowerCase()))) || (r ? 'Other' : 'Nairobi');

export default function AddressFormScreen() {
  const nav = useNav();
  const { id, pin } = useRoute<RouteProp<RootStackParamList, 'AddressForm'>>().params ?? {};
  const { user } = useAuth();
  const { addresses, addAddress, updateAddress } = useAppData();
  const editing = addresses.find((a) => a.id === id);
  const refs = { town: useRef<TextInput>(null), building: useRef<TextInput>(null), unit: useRef<TextInput>(null), landmark: useRef<TextInput>(null), phone: useRef<TextInput>(null) };

  const [label, setLabel] = useState<Address['label']>(editing?.label ?? 'Home');
  const [county, setCounty] = useState(editing?.county ?? 'Nairobi');
  const [town, setTown] = useState(editing?.town ?? '');
  const [area, setArea] = useState(editing?.area ?? '');
  const [building, setBuilding] = useState(editing?.building ?? '');
  const [unit, setUnit] = useState(editing?.unit ?? '');
  const [landmark, setLandmark] = useState(editing?.landmark ?? '');
  const [phone, setPhone] = useState(editing?.phone ?? user?.phone ?? '');
  const [isDefault, setIsDefault] = useState(editing?.isDefault ?? addresses.length === 0);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | undefined>(editing?.lat != null ? { lat: editing.lat, lng: editing.lng! } : undefined);
  const [errors, setErrors] = useState<Errors>({});
  const [locating, setLocating] = useState(false);
  const [note, setNote] = useState<string>();

  /** Fill empty fields from a GPS fix or a map pin. */
  const fillFrom = async (lat: number, lng: number) => {
    setCoords({ lat, lng });
    try {
      const g = (await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng }))[0];
      if (!g) return;
      setCounty((c) => (c === 'Nairobi' && !editing ? mapCounty(g.region) : c));
      setTown((t) => t || g.city || g.subregion || '');
      setArea((a) => a || g.district || g.street || g.name || '');
      setNote('Pin saved. Check the details below and add your apartment or door number.');
    } catch { setNote('Pin saved. Fill in the area and door number below.'); }
  };

  useEffect(() => { if (pin) fillFrom(pin.lat, pin.lng); }, [pin?.lat, pin?.lng]); // eslint-disable-line react-hooks/exhaustive-deps

  const useGps = async () => {
    setLocating(true);
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (!perm.granted) { setNote('Location is off. You can still type your address or drop a pin on the map.'); return; }
      const p = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      await fillFrom(p.coords.latitude, p.coords.longitude);
    } catch { setNote('Could not get your location. Try the map pin instead.'); } finally { setLocating(false); }
  };

  const save = () => {
    const e: Errors = {};
    if (area.trim().length < 2) e.area = 'Add your area or estate, e.g. Kilimani';
    if (!building.trim() && !unit.trim()) e.unit = 'Add your apartment, house or door number';
    if (!isKenyanPhone(phone)) e.phone = 'Enter a valid phone number for the rider or courier';
    setErrors(e);
    if (Object.keys(e).length) return;
    const data = { label, county, town: town.trim() || county, area: area.trim(), building: building.trim(), unit: unit.trim(), landmark: landmark.trim(), phone: phone.replace(/[\s-]/g, ''), lat: coords?.lat, lng: coords?.lng, isDefault };
    if (editing) updateAddress(editing.id, data); else addAddress(data);
    nav.goBack();
  };

  return (
    <Screen scroll>
      <BackHeader title={editing ? 'Edit address' : 'New address'} />

      <View className="mb-5 mt-4 flex-row gap-3">
        <Pressable onPress={useGps} disabled={locating} className="h-20 flex-1 items-center justify-center rounded-2xl border border-brand-200 bg-brand-50 active:opacity-80">
          <Ionicons name="navigate" size={22} color="#F44236" /><Text className="mt-1 text-sm font-bold text-brand-700">{locating ? 'Locating…' : 'Use my location'}</Text>
        </Pressable>
        <Pressable onPress={() => nav.navigate('MapPicker', { lat: coords?.lat, lng: coords?.lng })} className="h-20 flex-1 items-center justify-center rounded-2xl border border-line bg-white active:bg-cream">
          <Ionicons name="map" size={22} color="#1C1917" /><Text className="mt-1 text-sm font-bold text-ink">Pin on map</Text>
        </Pressable>
      </View>
      {coords ? <View className="-mt-2 mb-4 flex-row items-center"><Ionicons name="checkmark-circle" size={16} color="#15803D" /><Text className="ml-1.5 flex-1 text-xs text-success">Pinned at {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}</Text></View> : null}
      {note ? <Text className="-mt-1 mb-4 text-sm leading-5 text-ink-soft">{note}</Text> : null}

      <Text className="mb-2 text-sm font-medium text-ink">Label</Text>
      <View className="mb-4 flex-row">{(['Home', 'Work', 'Other'] as const).map((l) => <Chip key={l} label={l} active={label === l} onPress={() => setLabel(l)} />)}</View>

      <Text className="mb-2 text-sm font-medium text-ink">County</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-6 mb-4" contentContainerStyle={{ paddingHorizontal: 24 }}>
        {COUNTIES.map((c) => <Chip key={c} label={c} active={county === c} onPress={() => setCounty(c)} />)}
      </ScrollView>

      <Input label="Area, estate or ward" icon="map-outline" placeholder="Kilimani" autoCapitalize="words" value={area} onChangeText={(t) => { setArea(t); setErrors((p) => ({ ...p, area: undefined })); }} error={errors.area} returnKeyType="next" onSubmitEditing={() => refs.town.current?.focus()} />
      <Input ref={refs.town} label="Town or city" icon="business-outline" placeholder="Nairobi" autoCapitalize="words" value={town} onChangeText={setTown} returnKeyType="next" onSubmitEditing={() => refs.building.current?.focus()} />
      <Input ref={refs.building} label="Building or apartment name" icon="home-outline" placeholder="Argwings Court" autoCapitalize="words" value={building} onChangeText={(t) => { setBuilding(t); setErrors((p) => ({ ...p, unit: undefined })); }} returnKeyType="next" onSubmitEditing={() => refs.unit.current?.focus()} />
      <Input ref={refs.unit} label="House, floor or door number" icon="key-outline" placeholder="Apt 4B, 2nd floor" value={unit} onChangeText={(t) => { setUnit(t); setErrors((p) => ({ ...p, unit: undefined })); }} error={errors.unit} returnKeyType="next" onSubmitEditing={() => refs.landmark.current?.focus()} />
      <Input ref={refs.landmark} label="Landmark (optional)" icon="flag-outline" placeholder="Next to Yaya Centre" autoCapitalize="sentences" value={landmark} onChangeText={setLandmark} returnKeyType="next" onSubmitEditing={() => refs.phone.current?.focus()} />
      <Input ref={refs.phone} label="Phone for the rider or courier" icon="call-outline" placeholder="0712 345 678" keyboardType="phone-pad" value={phone} onChangeText={(t) => { setPhone(t); setErrors((p) => ({ ...p, phone: undefined })); }} error={errors.phone} />

      <View className="mb-5 flex-row items-center rounded-2xl border border-line bg-white p-4">
        <Text className="flex-1 text-base font-semibold text-ink">Make this my default address</Text>
        <Switch value={isDefault} onValueChange={setIsDefault} trackColor={{ true: '#F44236', false: '#E7E2DA' }} thumbColor="#fff" />
      </View>
      <Button title="Save address" onPress={save} />
    </Screen>
  );
}
