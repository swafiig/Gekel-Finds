import React, { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Screen from '../../components/Screen';
import BackHeader from '../../components/BackHeader';
import Input from '../../components/Input';
import Button from '../../components/Button';
import FormError from '../../components/FormError';
import { useAuth } from '../../context/AuthContext';
import { ApiError } from '../../services/http';
import { fieldErrors, friendlyError } from '../../utils/apiErrors';
import { isEmail } from '../../utils/validation';
import { useNav } from '../../hooks/useNav';

export default function EditProfileScreen() {
  const nav = useNav();
  const { user, updateProfile } = useAuth();
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});
  const [formError, setFormError] = useState<string>();
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const e: typeof errors = {};
    if (name.trim().length < 2) e.name = 'Enter your full name';
    if (email.trim() && !isEmail(email)) e.email = 'That email does not look right';
    setErrors(e);
    setFormError(undefined);
    if (Object.keys(e).length) return;

    const patch: { name?: string; email?: string } = {};
    if (name.trim() !== user?.name) patch.name = name.trim();
    if (email.trim().toLowerCase() !== (user?.email ?? '')) patch.email = email.trim();
    if (!Object.keys(patch).length) return nav.goBack();

    try {
      setSaving(true);
      await updateProfile(patch);
      Alert.alert('Saved', 'Your profile was updated.', [{ text: 'OK', onPress: () => nav.goBack() }]);
    } catch (err) {
      const server = fieldErrors(err, { full_name: 'name' });
      if (Object.keys(server).length) setErrors(server);
      else if (err instanceof ApiError && err.code === 'account_exists') setErrors({ email: 'Another account already uses this email' });
      else setFormError(friendlyError(err, 'Could not save your changes.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen scroll>
      <BackHeader title="Edit profile" />
      <View className="mt-4" />
      <FormError message={formError} />
      <Input label="Full name" icon="person-outline" autoCapitalize="words" value={name} onChangeText={(t) => { setName(t); setErrors((p) => ({ ...p, name: undefined })); }} error={errors.name} returnKeyType="next" />
      <Input label="Email (optional)" icon="mail-outline" keyboardType="email-address" placeholder="you@email.com" value={email} onChangeText={(t) => { setEmail(t); setErrors((p) => ({ ...p, email: undefined })); }} error={errors.email}
        hint={user?.email ? (user.emailVerified ? 'Verified' : 'Not verified yet') : 'Add an email for receipts and recovery'} returnKeyType="done" onSubmitEditing={save} />

      <View className="mb-6 flex-row items-center rounded-2xl border border-line bg-cream px-4 py-3.5">
        <Ionicons name="call-outline" size={20} color={ic.faint} />
        <View className="ml-3 flex-1"><Text className="text-xs text-ink-mute">Phone number</Text><Text className="text-base font-semibold text-ink">{user?.phone}</Text></View>
        {user?.phoneVerified ? (
          <View className="flex-row items-center"><Ionicons name="checkmark-circle" size={16} color="#15803D" /><Text className="ml-1 text-xs font-bold text-success">Verified</Text></View>
        ) : (
          <Pressable hitSlop={8} onPress={() => nav.navigate('VerifyPhone', { autoSend: true })}><Text className="text-xs font-bold text-brand-600">Verify</Text></Pressable>
        )}
      </View>
      <Text className="-mt-3 mb-6 text-xs leading-5 text-ink-mute">Your phone number receives sign-in codes, so it cannot be changed here. Contact support to change it.</Text>

      <Button title="Save changes" onPress={save} loading={saving} />
    </Screen>
  );
}
