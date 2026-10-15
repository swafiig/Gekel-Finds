import React, { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useRoute } from '@react-navigation/native';
import { useNav } from '../../hooks/useNav';
import type { RootStackParamList } from '../../types/navigation';

const mmss = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

/**
 * In-app call UI with a hard time limit. This is a UI mock.
 * TODO: connect a VoIP provider (Agora, Twilio Voice, Daily) so numbers stay private.
 */
export default function CallScreen() {
  const nav = useNav();
  const { name, role, limitSeconds = 300 } = useRoute<RouteProp<RootStackParamList, 'Call'>>().params;
  const [phase, setPhase] = useState<'calling' | 'connected' | 'ended'>('calling');
  const [secs, setSecs] = useState(0);
  const [muted, setMuted] = useState(false);
  const [speaker, setSpeaker] = useState(false);

  useEffect(() => { if (phase !== 'calling') return; const t = setTimeout(() => setPhase('connected'), 2000); return () => clearTimeout(t); }, [phase]);
  useEffect(() => { if (phase !== 'connected') return; const t = setInterval(() => setSecs((s) => s + 1), 1000); return () => clearInterval(t); }, [phase]);
  useEffect(() => { if (phase === 'connected' && secs >= limitSeconds) setPhase('ended'); }, [secs, phase, limitSeconds]);
  useEffect(() => { if (phase !== 'ended') return; const t = setTimeout(() => nav.goBack(), 1400); return () => clearTimeout(t); }, [phase, nav]);

  const remaining = Math.max(0, limitSeconds - secs);
  const warn = phase === 'connected' && remaining <= 30;

  const Ctl = ({ icon, label, on, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; on?: boolean; onPress: () => void }) => (
    <View className="items-center">
      <Pressable onPress={onPress} accessibilityLabel={label} className={`h-16 w-16 items-center justify-center rounded-full ${on ? 'bg-white' : 'bg-white-15'}`}><Ionicons name={icon} size={26} color={on ? '#1C1917' : '#fff'} /></Pressable>
      <Text className="mt-2 text-xs text-white-80">{label}</Text>
    </View>
  );

  return (
    <View className="flex-1 bg-[#1C1917]">
      <StatusBar style="light" />
      <SafeAreaView className="flex-1 items-center justify-between px-6 pb-8">
        <View className="items-center pt-10">
          <View className="h-28 w-28 items-center justify-center rounded-full bg-brand-500"><Text className="text-5xl font-bold text-white">{name.charAt(0)}</Text></View>
          <Text className="mt-5 text-3xl font-extrabold text-white">{name}</Text>
          {role ? <Text className="mt-1 text-base text-white-70">{role}</Text> : null}
          <Text className="mt-5 text-lg font-semibold text-white">
            {phase === 'calling' ? 'Calling…' : phase === 'ended' ? 'Call ended' : mmss(secs)}
          </Text>
          {phase === 'connected' && (
            <View className="mt-4 w-56">
              <View className="h-1.5 overflow-hidden rounded-full bg-white-20"><View style={{ width: `${(secs / limitSeconds) * 100}%` }} className={`h-full rounded-full ${warn ? 'bg-red-400' : 'bg-brand-400'}`} /></View>
              <Text className={`mt-2 text-center text-xs ${warn ? 'text-red-300' : 'text-white-60'}`}>{warn ? `Call ends in ${remaining}s` : `Time left ${mmss(remaining)}`}</Text>
            </View>
          )}
        </View>

        <View className="w-full">
          <View className="mb-8 flex-row justify-around">
            <Ctl icon={muted ? 'mic-off' : 'mic'} label="Mute" on={muted} onPress={() => setMuted((m) => !m)} />
            <Ctl icon="volume-high" label="Speaker" on={speaker} onPress={() => setSpeaker((s) => !s)} />
          </View>
          <Pressable onPress={() => setPhase('ended')} accessibilityLabel="End call" className="h-16 w-16 items-center justify-center self-center rounded-full bg-red-500"><Ionicons name="call" size={28} color="#fff" style={{ transform: [{ rotate: '135deg' }] }} /></Pressable>
          <Text className="mt-6 text-center text-xs leading-5 text-white-50">Calls are limited to {Math.round(limitSeconds / 60)} minutes and go through GEKEL, so your number stays private.</Text>
        </View>
      </SafeAreaView>
    </View>
  );
}
