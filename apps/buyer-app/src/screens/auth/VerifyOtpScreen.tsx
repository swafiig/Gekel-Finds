import React, { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Screen from '../../components/Screen';
import BackHeader from '../../components/BackHeader';
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
    <Screen scroll>
      <BackHeader />
      <View className="mt-4 mb-8">
        <Text className="text-[32px] font-extrabold text-ink">Check your {identifier.includes('@') ? 'email' : 'messages'}</Text>
        <Text className="mt-2 text-base text-ink-soft">
          We sent a 6-digit code to <Text className="font-semibold text-ink">{identifier}</Text>.
        </Text>
        <Text className="mt-1 text-xs text-ink-mute">(Dev mode: use 123456)</Text>
      </View>

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
    </Screen>
  );
}
