import React, { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useRoute } from '@react-navigation/native';
import Screen from '../../components/Screen';
import BackHeader from '../../components/BackHeader';
import OtpInput from '../../components/OtpInput';
import Button from '../../components/Button';
import FormError from '../../components/FormError';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../services/authApi';
import { ApiError } from '../../services/http';
import { friendlyError } from '../../utils/apiErrors';
import { useNav } from '../../hooks/useNav';
import type { RootStackParamList } from '../../types/navigation';

/** Confirms the phone number with a 6-digit SMS code. Opened after signup and from the Home banner. */
export default function VerifyPhoneScreen() {
  const nav = useNav();
  const autoSend = useRoute<RouteProp<RootStackParamList, 'VerifyPhone'>>().params?.autoSend ?? false;
  const { user, refreshUser } = useAuth();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  // After signup a code was just sent, so start on the 60 s cooldown; otherwise we send one on open.
  const [seconds, setSeconds] = useState(autoSend ? 0 : 60);

  const send = async () => {
    setError(undefined);
    try {
      const r = await authApi.sendPhoneCode();
      setSeconds(r.resend_after_seconds || 60);
      setCode('');
    } catch (e) {
      if (e instanceof ApiError && e.code === 'already_verified') { await refreshUser(); setDone(true); return; }
      if (e instanceof ApiError && e.retryAfter) setSeconds(e.retryAfter); // a code was just sent: wait it out
      else setError(friendlyError(e, 'Could not send the code.'));
    }
  };

  useEffect(() => { if (autoSend) void send(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
      await authApi.verifyPhone(value);
      await refreshUser();
      setDone(true);
    } catch (e) {
      setError(friendlyError(e, 'Could not verify the code.'));
      if (e instanceof ApiError && e.status === 400) setCode('');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <Screen>
        <View className="flex-1 items-center justify-center">
          <View className="mb-6 h-24 w-24 items-center justify-center rounded-full bg-green-100"><Ionicons name="shield-checkmark" size={56} color="#15803D" /></View>
          <Text className="text-center text-[28px] font-extrabold text-ink">Phone verified</Text>
          <Text className="mt-2 px-6 text-center text-base text-ink-soft">{user?.phone} is confirmed. You can now recover your account by SMS.</Text>
        </View>
        <Button title="Continue" onPress={() => nav.goBack()} />
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <BackHeader title="Verify your phone" onBack={() => nav.goBack()} />
      <View className="mt-6 items-center">
        <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-brand-50"><Ionicons name="chatbubble-ellipses" size={28} color="#F44236" /></View>
        <Text className="text-center text-2xl font-extrabold text-ink">Enter the code</Text>
        <Text className="mb-8 mt-2 text-center text-base leading-6 text-ink-soft">We sent a 6-digit code by SMS to <Text className="font-bold text-ink">{user?.phone}</Text>. It expires in 5 minutes.</Text>
      </View>
      <FormError message={error} />
      <OtpInput value={code} onChange={(v) => { setCode(v); setError(undefined); }} onComplete={verify} error={!!error} />
      <Button title="Verify" className="mt-8" onPress={() => verify()} loading={loading} disabled={code.length < 6} />
      <View className="mt-6 flex-row justify-center">
        {seconds > 0 ? <Text className="text-base text-ink-soft">Resend code in {seconds}s</Text> : (
          <Pressable hitSlop={8} onPress={send}><Text className="text-base font-semibold text-brand-600">Resend code</Text></Pressable>
        )}
      </View>
      <Pressable hitSlop={8} onPress={() => nav.goBack()} className="mt-6 self-center"><Text className="text-sm font-semibold text-ink-mute">Do this later</Text></Pressable>
    </Screen>
  );
}
