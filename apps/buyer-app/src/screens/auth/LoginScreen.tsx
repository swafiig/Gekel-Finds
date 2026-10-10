import React, { useRef, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AuthLayout from '../../components/AuthLayout';
import Input from '../../components/Input';
import Button from '../../components/Button';
import FormError from '../../components/FormError';
import { useAuth } from '../../context/AuthContext';
import { isEmailOrPhone } from '../../utils/validation';
import type { RootStackParamList } from '../../types/navigation';

export default function LoginScreen() {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { login } = useAuth();
  const passRef = useRef<TextInput>(null);

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ identifier?: string; password?: string }>({});
  const [formError, setFormError] = useState<string>();
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    const e: typeof errors = {};
    if (!isEmailOrPhone(identifier)) e.identifier = 'Enter a valid phone number or email';
    if (!password) e.password = 'Enter your password';
    setErrors(e);
    setFormError(undefined);
    if (Object.keys(e).length) return;

    try {
      setLoading(true);
      await login(identifier.trim(), password);
      // AuthContext flips status -> navigator swaps to Main automatically
    } catch (err: any) {
      setFormError(err?.message ?? 'We could not log you in. Check your details and try again.');
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Welcome back" subtitle="Log in to keep tracking your requests and orders.">

      <FormError message={formError} />

      <Input
        label="Phone or email"
        icon="person-outline"
        placeholder="0712 345 678 or you@email.com"
        keyboardType="email-address"
        autoComplete="username"
        textContentType="username"
        value={identifier}
        onChangeText={(t) => { setIdentifier(t); setErrors((p) => ({ ...p, identifier: undefined })); }}
        error={errors.identifier}
        returnKeyType="next"
        onSubmitEditing={() => passRef.current?.focus()}
      />
      <Input
        ref={passRef}
        label="Password"
        icon="lock-closed-outline"
        placeholder="Your password"
        secure
        autoComplete="current-password"
        textContentType="password"
        value={password}
        onChangeText={(t) => { setPassword(t); setErrors((p) => ({ ...p, password: undefined })); }}
        error={errors.password}
        returnKeyType="go"
        onSubmitEditing={submit}
      />

      <Pressable hitSlop={8} onPress={() => nav.navigate('ForgotPassword')} className="-mt-1 mb-6 self-end">
        <Text className="text-sm font-semibold text-brand-600">Forgot password?</Text>
      </Pressable>

      <Button title="Log in" onPress={submit} loading={loading} />

      <View className="flex-1" />
      <View className="mt-8 flex-row justify-center">
        <Text className="text-base text-ink-soft">New to GEKEL? </Text>
        <Pressable hitSlop={8} onPress={() => nav.replace('Register')}>
          <Text className="text-base font-semibold text-brand-600">Create account</Text>
        </Pressable>
      </View>
    </AuthLayout>
  );
}
