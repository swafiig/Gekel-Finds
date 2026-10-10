import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AuthLayout from '../../components/AuthLayout';
import Input from '../../components/Input';
import Button from '../../components/Button';
import FormError from '../../components/FormError';
import { authApi } from '../../services/authApi';
import { isEmailOrPhone } from '../../utils/validation';
import type { RootStackParamList } from '../../types/navigation';

export default function ForgotPasswordScreen() {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [identifier, setIdentifier] = useState('');
  const [error, setError] = useState<string>();
  const [formError, setFormError] = useState<string>();
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setFormError(undefined);
    if (!isEmailOrPhone(identifier)) return setError('Enter a valid phone number or email');
    try {
      setLoading(true);
      await authApi.requestPasswordReset(identifier.trim());
      nav.navigate('VerifyOtp', { identifier: identifier.trim() });
    } catch (e: any) {
      setFormError(e?.message ?? 'Could not send the code. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Forgot password?" subtitle="Enter the phone number or email you signed up with. We will send you a 6-digit code.">

      <FormError message={formError} />
      <Input
        label="Phone or email"
        icon="person-outline"
        placeholder="0712 345 678 or you@email.com"
        keyboardType="email-address"
        value={identifier}
        onChangeText={(t) => { setIdentifier(t); setError(undefined); }}
        error={error}
        returnKeyType="send"
        onSubmitEditing={submit}
        autoFocus
      />
      <Button title="Send code" onPress={submit} loading={loading} className="mt-2" />
      <Button title="Back to log in" variant="ghost" className="mt-2" onPress={() => nav.goBack()} />
    </AuthLayout>
  );
}
