import React, { useRef, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AuthLayout from '../../components/AuthLayout';
import Input from '../../components/Input';
import Button from '../../components/Button';
import FormError from '../../components/FormError';
import PasswordStrength from '../../components/PasswordStrength';
import { useAuth } from '../../context/AuthContext';
import { ApiError } from '../../services/http';
import { fieldErrors, friendlyError } from '../../utils/apiErrors';
import { isEmail, isKenyanPhone, validatePassword } from '../../utils/validation';
import { useNav } from '../../hooks/useNav';

type Errors = Partial<Record<'name' | 'phone' | 'email' | 'password' | 'confirm' | 'terms', string>>;

export default function RegisterScreen() {
  const nav = useNav();
  const { register } = useAuth();
  const phoneRef = useRef<TextInput>(null);
  const emailRef = useRef<TextInput>(null);
  const passRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  const [form, setForm] = useState({ name: '', phone: '', email: '', password: '', confirm: '' });
  const [agree, setAgree] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string>();
  const [exists, setExists] = useState(false);
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
    setExists(false);
    if (Object.keys(e).length) return;

    try {
      setLoading(true);
      await register({ name: form.name.trim(), phone: form.phone.trim(), email: form.email.trim() || undefined, password: form.password });
    } catch (err) {
      const server = fieldErrors(err, { full_name: 'name' }) as Errors;
      if (Object.keys(server).length) setErrors(server); // show the server's reasons next to the fields
      else if (err instanceof ApiError && err.code === 'account_exists') { setExists(true); setFormError(err.message); }
      else setFormError(friendlyError(err, 'We could not create your account. Try again.'));
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Ask for anything in Nairobi and get it at the real price."
    >
      <FormError message={formError} />
      {exists && (
        <Pressable onPress={() => nav.replace('Login')} className="-mt-2 mb-4 self-start">
          <Text className="text-sm font-semibold text-brand-600">Log in to that account instead</Text>
        </Pressable>
      )}

      <Input label="Full name" icon="person-outline" placeholder="Kelvin Otieno" autoCapitalize="words" autoComplete="name" textContentType="name"
        value={form.name} onChangeText={set('name')} error={errors.name} returnKeyType="next" onSubmitEditing={() => phoneRef.current?.focus()} />
      <Input ref={phoneRef} label="Phone number" icon="call-outline" placeholder="0712 345 678" keyboardType="phone-pad" autoComplete="tel" textContentType="telephoneNumber"
        value={form.phone} onChangeText={set('phone')} error={errors.phone} hint="We use this for M-Pesa, delivery updates and password resets"
        returnKeyType="next" onSubmitEditing={() => emailRef.current?.focus()} />
      <Input ref={emailRef} label="Email (optional)" icon="mail-outline" placeholder="you@email.com" keyboardType="email-address" autoComplete="email" textContentType="emailAddress"
        value={form.email} onChangeText={set('email')} error={errors.email} returnKeyType="next" onSubmitEditing={() => passRef.current?.focus()} />
      <Input ref={passRef} label="Password" icon="lock-closed-outline" placeholder="At least 10 characters" secure autoComplete="new-password" textContentType="newPassword"
        value={form.password} onChangeText={set('password')} error={errors.password} returnKeyType="next" onSubmitEditing={() => confirmRef.current?.focus()} />
      <PasswordStrength value={form.password} />
      <Input ref={confirmRef} label="Confirm password" icon="lock-closed-outline" placeholder="Repeat password" secure
        value={form.confirm} onChangeText={set('confirm')} error={errors.confirm} returnKeyType="go" onSubmitEditing={submit} />

      <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: agree }}
        onPress={() => { setAgree((a) => !a); setErrors((p) => ({ ...p, terms: undefined })); }} className="mb-1 flex-row items-start">
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
    </AuthLayout>
  );
}
