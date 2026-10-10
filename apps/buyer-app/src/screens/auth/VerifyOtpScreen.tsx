import React, { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AuthLayout from '../../components/AuthLayout';
import OtpInput from '../../components/OtpInput';
import Button from '../../components/Button';
import FormError from '../../components/FormError';
import { authApi } from '../../services/authApi';
import type { RootStackParamList } from '../../types/navigation';

const RESEND_SECONDS = 30;

export default function VerifyOtpScreen() {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { identifier } = useRoute<RouteProp<RootStackParamList, 'VerifyOtp'>>().params;
  const [code, setCode] = useState('');
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [seconds, setSeconds] = useState(RESEND_SECONDS);

  useEffect(() => {
    if (seconds <= 0) return;
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);

  const verify = async (value = code) => {
    if (value.length < 6) return setError('Enter the 6-digit code');
    try {
      setLoading(true);
      setError(undefined);
      await authApi.verifyOtp(identifier, value);
      nav.navigate('ResetPassword', { identifier, code: value });
    } catch (e: any) {
      setError(e?.message ?? 'Could not verify the code.');
      setCode('');
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    setSeconds(RESEND_SECONDS);
    setError(undefined);
    await authApi.requestPasswordReset(identifier);
  };

  return (
    <AuthLayout title={`Check your ${identifier.includes('@') ? 'email' : 'messages'}`} subtitle={`We sent a 6-digit code to ${identifier}. (Dev mode: use 123456)`}>

      <FormError message={error} />
      <OtpInput value={code} onChange={(v) => { setCode(v); setError(undefined); }} onComplete={verify} error={!!error} />

      <Button title="Verify code" className="mt-8" onPress={() => verify()} loading={loading} disabled={code.length < 6} />

      <View className="mt-6 flex-row justify-center">
        {seconds > 0 ? (
          <Text className="text-base text-ink-soft">Resend code in {seconds}s</Text>
        ) : (
          <Pressable hitSlop={8} onPress={resend}>
            <Text className="text-base font-semibold text-brand-600">Resend code</Text>
          </Pressable>
        )}
      </View>
    </AuthLayout>
  );
}
