import React, { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import AuthLayout from '../../components/AuthLayout';
import OtpInput from '../../components/OtpInput';
import Button from '../../components/Button';
import FormError from '../../components/FormError';
import { authApi } from '../../services/authApi';
import { ApiError } from '../../services/http';
import { friendlyError } from '../../utils/apiErrors';
import { useNav } from '../../hooks/useNav';
import type { RootStackParamList } from '../../types/navigation';

export default function VerifyOtpScreen() {
  const nav = useNav();
  const { identifier } = useRoute<RouteProp<RootStackParamList, 'VerifyOtp'>>().params;
  const [code, setCode] = useState('');
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [seconds, setSeconds] = useState(60); // the server enforces the same 60 s between codes

  useEffect(() => {
    if (seconds <= 0) return;
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);

  const verify = async (value = code) => {
    if (value.length < 6) return setError('Enter the 6-digit code');
    if (loading) return;
    try {
      setLoading(true);
      setError(undefined);
      const { reset_token } = await authApi.verifyOtp(identifier, value);
      nav.navigate('ResetPassword', { resetToken: reset_token });
    } catch (e) {
      setError(friendlyError(e, 'Could not verify the code.'));
      if (e instanceof ApiError && e.status === 400) setCode(''); // wrong code: start fresh
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    setError(undefined);
    try {
      const r = await authApi.forgotPassword(identifier);
      setSeconds(r.resend_after_seconds || 60);
      setCode('');
    } catch (e) {
      if (e instanceof ApiError && e.retryAfter) setSeconds(e.retryAfter);
      setError(friendlyError(e, 'Could not send a new code.'));
    }
  };

  return (
    <AuthLayout title="Enter the code" subtitle="We sent a 6-digit code by SMS to the phone number on your account. It expires in 5 minutes.">
      <FormError message={error} />
      <OtpInput value={code} onChange={(v) => { setCode(v); setError(undefined); }} onComplete={verify} error={!!error} />

      <Button title="Verify code" className="mt-8" onPress={() => verify()} loading={loading} disabled={code.length < 6} />

      <View className="mt-6 flex-row justify-center">
        {seconds > 0 ? (
          <Text className="text-base text-ink-soft">Resend code in {seconds}s</Text>
        ) : (
          <Pressable hitSlop={8} onPress={resend}><Text className="text-base font-semibold text-brand-600">Resend code</Text></Pressable>
        )}
      </View>
      <Text className="mt-6 text-center text-xs leading-5 text-ink-mute">Never share this code. GEKEL staff will never ask for it.</Text>
    </AuthLayout>
  );
}
