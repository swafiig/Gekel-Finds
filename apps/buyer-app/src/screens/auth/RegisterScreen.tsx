import React, { useRef, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Screen from '../../components/Screen';
import BackHeader from '../../components/BackHeader';
import Input from '../../components/Input';
import Button from '../../components/Button';
import FormError from '../../components/FormError';
import PasswordStrength from '../../components/PasswordStrength';
import { useAuth } from '../../context/AuthContext';
import { isEmail, isKenyanPhone, validatePassword } from '../../utils/validation';
import type { RootStackParamList } from '../../types/navigation';

type Errors = Partial<Record<'name' | 'phone' | 'email' | 'password' | 'confirm' | 'terms', string>>;

export default function RegisterScreen() {
  const nav = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { register, signupIntent } = useAuth();
  const phoneRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const passRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  const [form, setForm] = useState({ name: '', phone: '', email: '', password: '', confirm: '' });
  const [agree, setAgree] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string>();
  const [loading, setLoading] = useState(false);

  const set = (k: keyof typeof form) => (v: string) => {
    setForm((p) => ({ ...p, [k]: v }));
    setErrors((p) => ({ ...p, [k]: undefined }));
  };

  const submit = async () => {
    const e: Errors = {};
    if (form.name.trim().length < 2) e.name = 'Enter your full name';
    if (!isKenyanPhone(form.phone)) e.phone = 'Enter a valid Kenyan number, e.g. 0712 345 678';
    if (form.email && !isEmail(form.email)) e.email = 'That email does not look right';
    const pw = validatePassword(form.password);
    if (pw) e.password = pw;
    if (form.confirm !== form.password) e.confirm = 'Passwords do not match';
    if (!agree) e.terms = 'Accept the terms to continue';
    setErrors(e);
    setFormError(undefined);
    if (Object.keys(e).length) return;

    try {
      setLoading(true);
      await register({
        name: form.name.trim(),
        phone: form.phone.replace(/[\s-]/g, ''),
        email: form.email.trim() || undefined,
        password: form.password,
      });
    } catch (err: any) {
      setFormError(err?.message ?? 'We could not create your account. Try again.');
      setLoading(false);
    }
  };

  return (
    <Screen scroll>
      <BackHeader />
      <View className="mt-4 mb-6">
        <Text className="text-[32px] font-extrabold text-ink">
          {signupIntent === 'supplier' ? 'Join as a supplier' : 'Create your account'}
        </Text>
        <Text className="mt-2 text-base text-ink-soft">
          {signupIntent === 'supplier'
            ? 'Set up your account to link your Till and start receiving orders.'
            : 'Ask for anything in Nairobi and get it at the real price.'}
        </Text>
      </View>

      <FormError message={formError} />

      <Input label="Full name" icon="person-outline" placeholder="Kelvin Otieno" autoCapitalize="words"
        autoComplete="name" textContentType="name" value={form.name} onChangeText={set('name')}
        error={errors.name} returnKeyType="next" onSubmitEditing={() => phoneRef.current?.focus()} />
      <Input ref={phoneRef} label="Phone number" icon="call-outline" placeholder="0712 345 678"
        keyboardType="phone-pad" autoComplete="tel" textContentType="telephoneNumber"
        value={form.phone} onChangeText={set('phone')} error={errors.phone}
        hint="We use this for M-Pesa and delivery updates" returnKeyType="next"
        onSubmitEditing={() => emailRef.current?.focus()} />
      <Input ref={emailRef} label="Email (optional)" icon="mail-outline" placeholder="you@email.com"
        keyboardType="email-address" autoComplete="email" textContentType="emailAddress"
        value={form.email} onChangeText={set('email')} error={errors.email} returnKeyType="next"
        onSubmitEditing={() => passRef.current?.focus()} />
      <Input ref={passRef} label="Password" icon="lock-closed-outline" placeholder="At least 8 characters"
        secure autoComplete="new-password" textContentType="newPassword" value={form.password}
        onChangeText={set('password')} error={errors.password} returnKeyType="next"
        onSubmitEditing={() => confirmRef.current?.focus()} />
      <PasswordStrength value={form.password} />
      <Input ref={confirmRef} label="Confirm password" icon="lock-closed-outline" placeholder="Repeat password"
        secure value={form.confirm} onChangeText={set('confirm')} error={errors.confirm}
        returnKeyType="go" onSubmitEditing={submit} />

      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: agree }}
        onPress={() => { setAgree((a) => !a); setErrors((p) => ({ ...p, terms: undefined })); }}
        className="mb-1 flex-row items-start"
      >
        <View className={`mr-3 mt-0.5 h-6 w-6 items-center justify-center rounded-md border-2 ${agree ? 'border-brand-500 bg-brand-500' : 'border-line bg-white'}`}>
          {agree && <Ionicons name="checkmark" size={16} color="#fff" />}
        </View>
        <Text className="flex-1 text-sm leading-5 text-ink-soft">
          I agree to the <Text className="font-semibold text-brand-600">Terms of Service</Text> and{' '}
          <Text className="font-semibold text-brand-600">Privacy Policy</Text>
        </Text>
      </Pressable>
      {errors.terms && <Text className="mb-2 ml-9 text-sm text-danger">{errors.terms}</Text>}

      <Button title="Create account" className="mt-5" onPress={submit} loading={loading} />

      <View className="mt-8 flex-row justify-center">
        <Text className="text-base text-ink-soft">Already have an account? </Text>
        <Pressable hitSlop={8} onPress={() => nav.replace('Login')}>
          <Text className="text-base font-semibold text-brand-600">Log in</Text>
        </Pressable>
      </View>
    </Screen>
  );
}
