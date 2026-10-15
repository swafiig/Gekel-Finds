import React, { useState } from 'react';
import { FlatList, Pressable, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../../components/Screen';
import BackHeader from '../../components/BackHeader';
import Button from '../../components/Button';
import EmptyState from '../../components/EmptyState';
import { ERRAND_STAGES, useAppData } from '../../context/AppDataContext';
import { ERRAND_TYPES, timeAgo } from '../../data/mock';
import { useNav } from '../../hooks/useNav';

/** Gekel Errands: local jobs that aren't "buy something" — queueing, documents, small deliveries. */
export default function ErrandsScreen() {
  const nav = useNav();
  const { errands, addErrand } = useAppData();
  const [typeId, setTypeId] = useState<string>();
  const [details, setDetails] = useState('');
  const [error, setError] = useState<string>();
  const [showForm, setShowForm] = useState(errands.length === 0);

  const submit = () => {
    if (!typeId) return setError('Choose what kind of errand this is');
    if (details.trim().length < 5) return setError('Tell us a bit more so a runner knows what to do');
    addErrand(typeId, details.trim());
    setTypeId(undefined); setDetails(''); setError(undefined); setShowForm(false);
  };

  return (
    <Screen scroll>
      <BackHeader title="Gekel Errands" right={!showForm ? <Pressable hitSlop={8} onPress={() => setShowForm(true)}><Ionicons name="add-circle" size={24} color="#F44236" /></Pressable> : undefined} />
      <Text className="mb-4 mt-2 text-sm leading-5 text-ink-soft dark:text-sink-soft">Need something done, not bought? A GEKEL runner can queue, collect documents, pay a bill or make a delivery for you.</Text>

      {showForm && (
        <View className="mb-6 rounded-2xl border border-line dark:border-surface-line bg-white dark:bg-surface p-4">
          <Text className="mb-3 text-sm font-bold text-ink dark:text-sink">What do you need done?</Text>
          {ERRAND_TYPES.map((t) => (
            <Pressable key={t.id} onPress={() => setTypeId(t.id)} className={`mb-2 flex-row items-center rounded-2xl border p-3 ${typeId === t.id ? 'border-brand-500 bg-brand-50' : 'border-line dark:border-surface-line'}`}>
              <Ionicons name={t.icon as any} size={18} color={typeId === t.id ? '#F44236' : '#57534E'} />
              <View className="ml-3 flex-1"><Text className="text-sm font-bold text-ink dark:text-sink">{t.title}</Text><Text className="text-xs text-ink-soft dark:text-sink-soft">{t.blurb}</Text></View>
            </Pressable>
          ))}
          <Text className="mb-1.5 mt-2 text-sm font-medium text-ink dark:text-sink">Details</Text>
          <View className="mb-1 min-h-[88px] rounded-2xl border border-line dark:border-surface-line bg-cream dark:bg-surface-soft px-4 py-3">
            <TextInput multiline value={details} onChangeText={setDetails} placeholder="e.g. Collect my logbook from NTSA Upper Hill, open 9am-4pm" placeholderTextColor="#A8A29E" className="text-sm text-ink dark:text-sink" style={{ minHeight: 64, textAlignVertical: 'top' }} />
          </View>
          {error && <Text className="mb-3 text-xs text-danger">{error}</Text>}
          <Button title="Send errand" className="mt-2" onPress={submit} />
        </View>
      )}

      <Text className="mb-3 text-lg font-extrabold text-ink dark:text-sink">Your errands</Text>
      <FlatList
        data={errands} keyExtractor={(e) => e.id} scrollEnabled={false}
        ListEmptyComponent={<EmptyState icon="briefcase-outline" title="No errands yet" body="Start one above — queueing and small jobs around Nairobi." />}
        renderItem={({ item }) => {
          const type = ERRAND_TYPES.find((t) => t.id === item.typeId)!;
          return (
            <Pressable onPress={() => nav.navigate('ErrandDetail', { id: item.id })} className="mb-3 flex-row items-center rounded-2xl border border-line dark:border-surface-line bg-white dark:bg-surface p-3.5">
              <View className="h-10 w-10 items-center justify-center rounded-full bg-brand-50"><Ionicons name={type.icon as any} size={18} color="#F44236" /></View>
              <View className="ml-3 flex-1"><Text numberOfLines={1} className="text-sm font-bold text-ink dark:text-sink">{type.title}</Text><Text className="text-xs text-ink-soft dark:text-sink-soft">{ERRAND_STAGES[item.stage]} · {timeAgo(item.createdAt)}</Text></View>
              <Ionicons name="chevron-forward" size={16} color="#A8A29E" />
            </Pressable>
          );
        }}
      />
    </Screen>
  );
}
