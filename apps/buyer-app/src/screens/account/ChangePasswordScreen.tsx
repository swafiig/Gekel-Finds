import React, { useRef, useState } from 'react';
import { Alert, TextInput, View } from 'react-native';
import Screen from '../../components/Screen';
import BackHeader from '../../components/BackHeader';
import Input from '../../components/Input';
import Button from '../../components/Button';
import FormError from '../../components/FormError';
import PasswordStrength from '../../components/PasswordStrength';
import { authApi } from '../../services/authApi';
import { fieldErrors, friendlyError } from '../../utils/apiErrors';
import { validatePassword } from '../../utils/validation';
import { useNav } from '../../hooks/useNav';

type Errors = Partial<Record<'current' | 'next' | 'confirm', string>>;

export default function ChangePasswordScreen() {
  const nav = useNav();
  const nextRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string>();
  const [saving, setSaving] = useState(false);
  const clear = (k: keyof Errors) => setErrors((p) => ({ ...p, [k]: undefined }));

  const submit = async () => {
    const e: Errors = {};
    if (!current) e.current = 'Enter your current password';
    const pw = validatePassword(next);
    if (pw) e.next = pw;
    if (confirm !== next) e.confirm = 'Passwords do not match';
    setErrors(e);
    setFormError(undefined);
    if (Object.keys(e).length) return;
    try {
      setSaving(true);
      await authApi.changePassword(current, next);
      Alert.alert('Password changed', 'You stay signed in here. Your other devices were signed out.', [{ text: 'OK', onPress: () => nav.goBack() }]);
    } catch (err) {
      const server = fieldErrors(err, { current_password: 'current', new_password: 'next' }) as Errors;
      if (Object.keys(server).length) setErrors(server);
      else setFormError(friendlyError(err, 'Could not change your password.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen scroll>
      <BackHeader title="Change password" />
      <View className="mt-4" />
      <FormError message={formError} />
      <Input label="Current password" icon="lock-closed-outline" secure autoComplete="current-password" value={current}
        onChangeText={(t) => { setCurrent(t); clear('current'); }} error={errors.current} returnKeyType="next" onSubmitEditing={() => nextRef.current?.focus()} />
      <Input ref={nextRef} label="New password" icon="key-outline" secure autoComplete="new-password" placeholder="At least 10 characters" value={next}
        onChangeText={(t) => { setNext(t); clear('next'); }} error={errors.next} returnKeyType="next" onSubmitEditing={() => confirmRef.current?.focus()} />
      <PasswordStrength value={next} />
      <Input ref={confirmRef} label="Confirm new password" icon="key-outline" secure value={confirm}
        onChangeText={(t) => { setConfirm(t); clear('confirm'); }} error={errors.confirm} returnKeyType="go" onSubmitEditing={submit} />
      <Button title="Update password" onPress={submit} loading={saving} />
    </Screen>
  );
}
