import React, { useRef, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useRoute } from '@react-navigation/native';
import Screen from '../../components/Screen';
import AuthLayout from '../../components/AuthLayout';
import Input from '../../components/Input';
import Button from '../../components/Button';
import FormError from '../../components/FormError';
import PasswordStrength from '../../components/PasswordStrength';
import { authApi } from '../../services/authApi';
import { ApiError } from '../../services/http';
import { fieldErrors, friendlyError } from '../../utils/apiErrors';
import { validatePassword } from '../../utils/validation';
import { useNav } from '../../hooks/useNav';
import type { RootStackParamList } from '../../types/navigation';

export default function ResetPasswordScreen() {
  const nav = useNav();
  const { resetToken } = useRoute<RouteProp<RootStackParamList, 'ResetPassword'>>().params;
  const confirmRef = useRef<TextInput>(null);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({});
  const [formError, setFormError] = useState<string>();
  const [expired, setExpired] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async () => {
    const e: typeof errors = {};
    const pw = validatePassword(password);
    if (pw) e.password = pw;
    if (confirm !== password) e.confirm = 'Passwords do not match';
    setErrors(e);
    if (Object.keys(e).length) return;
    try {
      setLoading(true);
      setFormError(undefined);
      await authApi.resetPassword(resetToken, password);
      setDone(true);
    } catch (err) {
      const server = fieldErrors(err, { new_password: 'password', password: 'password' });
      if (Object.keys(server).length) setErrors(server);
      else if (err instanceof ApiError && err.code === 'invalid_reset_token') { setExpired(true); setFormError(err.message); }
      else setFormError(friendlyError(err, 'Could not reset your password. Try again.'));
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <Screen>
        <View className="flex-1 items-center justify-center">
          <View className="mb-6 h-24 w-24 items-center justify-center rounded-full bg-green-100"><Ionicons name="checkmark-circle" size={64} color="#15803D" /></View>
          <Text className="text-center text-[28px] font-extrabold text-ink">Password updated</Text>
          <Text className="mt-2 px-6 text-center text-base text-ink-soft">You were signed out of all devices. Log in with your new password.</Text>
        </View>
        <Button title="Log in" onPress={() => nav.reset({ index: 1, routes: [{ name: 'Welcome' }, { name: 'Login' }] })} />
      </Screen>
    );
  }

  return (
    <AuthLayout title="Set a new password" subtitle="Choose something you have not used on GEKEL before.">
      <FormError message={formError} />
      {expired && (
        <Pressable onPress={() => nav.reset({ index: 2, routes: [{ name: 'Welcome' }, { name: 'Login' }, { name: 'ForgotPassword' }] })} className="-mt-2 mb-4 self-start">
          <Text className="text-sm font-semibold text-brand-600">Start again</Text>
        </Pressable>
      )}
      <Input label="New password" icon="lock-closed-outline" placeholder="At least 10 characters" secure autoComplete="new-password" textContentType="newPassword"
        value={password} onChangeText={(t) => { setPassword(t); setErrors((p) => ({ ...p, password: undefined })); }}
        error={errors.password} returnKeyType="next" onSubmitEditing={() => confirmRef.current?.focus()} autoFocus />
      <PasswordStrength value={password} />
      <Input ref={confirmRef} label="Confirm new password" icon="lock-closed-outline" placeholder="Repeat password" secure
        value={confirm} onChangeText={(t) => { setConfirm(t); setErrors((p) => ({ ...p, confirm: undefined })); }}
        error={errors.confirm} returnKeyType="go" onSubmitEditing={submit} />
      <Button title="Update password" className="mt-2" onPress={submit} loading={loading} />
    </AuthLayout>
  );
}
