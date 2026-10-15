import React, { useState } from 'react';
import { Pressable, Text } from 'react-native';
import AuthLayout from '../../components/AuthLayout';
import Input from '../../components/Input';
import Button from '../../components/Button';
import FormError from '../../components/FormError';
import { authApi } from '../../services/authApi';
import { ApiError } from '../../services/http';
import { friendlyError } from '../../utils/apiErrors';
import { isEmailOrPhone } from '../../utils/validation';
import { useNav } from '../../hooks/useNav';

export default function ForgotPasswordScreen() {
  const nav = useNav();
  const [identifier, setIdentifier] = useState('');
  const [error, setError] = useState<string>();
  const [formError, setFormError] = useState<string>();
  const [cooldown, setCooldown] = useState(false); // a code was already sent recently
  const [loading, setLoading] = useState(false);

  const go = () => nav.navigate('VerifyOtp', { identifier: identifier.trim() });

  const submit = async () => {
    setFormError(undefined);
    setCooldown(false);
    if (!isEmailOrPhone(identifier)) return setError('Enter a valid phone number or email');
    try {
      setLoading(true);
      await authApi.forgotPassword(identifier.trim()); // always succeeds, whether or not the account exists
      go();
    } catch (e) {
      if (e instanceof ApiError && e.code === 'otp_cooldown') setCooldown(true);
      setFormError(friendlyError(e, 'Could not send the code. Try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Forgot password?" subtitle="Enter the phone number or email on your account. We will text a 6-digit code to the phone number we have for you.">
      <FormError message={formError} />
      {cooldown && (
        <Pressable onPress={go} className="-mt-2 mb-4 self-start"><Text className="text-sm font-semibold text-brand-600">I already have a code</Text></Pressable>
      )}
      <Input
        label="Phone or email" icon="person-outline" placeholder="0712 345 678 or you@email.com" keyboardType="email-address"
        value={identifier} onChangeText={(t) => { setIdentifier(t); setError(undefined); }} error={error}
        returnKeyType="send" onSubmitEditing={submit} autoFocus
      />
      <Button title="Send code" onPress={submit} loading={loading} className="mt-2" />
      <Button title="Back to log in" variant="ghost" className="mt-2" onPress={() => nav.goBack()} />
    </AuthLayout>
  );
}
