import React, { useRef, useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Screen from '../../components/Screen';
import BackHeader from '../../components/BackHeader';
import Input from '../../components/Input';
import Button from '../../components/Button';
import FormError from '../../components/FormError';
import PasswordStrength from '../../components/PasswordStrength';
import { authApi } from '../../services/authApi';
import { validatePassword } from '../../utils/validation';
import type { RootStackParamList } from '../../types/navigation';

export default function ResetPasswordScreen() {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { identifier, code } = useRoute<RouteProp<RootStackParamList, 'ResetPassword'>>().params;
  const confirmRef = useRef<TextInput>(null);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({});
  const [formError, setFormError] = useState<string>();
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
      await authApi.resetPassword(identifier, code, password);
      setDone(true);
    } catch (err: any) {
      setFormError(err?.message ?? 'Could not reset your password. Try again.');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <Screen>
        <View className="flex-1 items-center justify-center">
          <View className="mb-6 h-24 w-24 items-center justify-center rounded-full bg-green-100">
            <Ionicons name="checkmark-circle" size={64} color="#15803D" />
          </View>
          <Text className="text-center text-[28px] font-extrabold text-ink">Password updated</Text>
          <Text className="mt-2 px-6 text-center text-base text-ink-soft">
            You can now log in with your new password.
          </Text>
        </View>
        <Button
          title="Log in"
          onPress={() => nav.reset({ index: 1, routes: [{ name: 'Welcome' }, { name: 'Login' }] })}
        />
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <BackHeader />
      <View className="mt-4 mb-8">
        <Text className="text-[32px] font-extrabold text-ink">Set a new password</Text>
        <Text className="mt-2 text-base text-ink-soft">Choose something you have not used on GEKEL before.</Text>
      </View>
      <FormError message={formError} />
      <Input label="New password" icon="lock-closed-outline" placeholder="At least 8 characters" secure
        autoComplete="new-password" textContentType="newPassword" value={password}
        onChangeText={(t) => { setPassword(t); setErrors((p) => ({ ...p, password: undefined })); }}
        error={errors.password} returnKeyType="next" onSubmitEditing={() => confirmRef.current?.focus()} autoFocus />
      <PasswordStrength value={password} />
      <Input ref={confirmRef} label="Confirm new password" icon="lock-closed-outline" placeholder="Repeat password" secure
        value={confirm} onChangeText={(t) => { setConfirm(t); setErrors((p) => ({ ...p, confirm: undefined })); }}
        error={errors.confirm} returnKeyType="go" onSubmitEditing={submit} />
      <Button title="Update password" className="mt-2" onPress={submit} loading={loading} />
    </Screen>
  );
}
