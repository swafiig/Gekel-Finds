import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Banner, Button, Field, Header, Screen } from "../../components/ui";
import { OtpInput } from "../../components/OtpInput";
import { api, MOCK_HINTS, USING_MOCK } from "../../lib/api";
import { normalisePhone } from "../../lib/format";
import { useAuth } from "../../store/auth";
import type { AuthStackParams } from "../../navigation/types";

type Props = NativeStackScreenProps<AuthStackParams, "Login">;
const RESEND_SECONDS = 30;

export function Login({ navigation }: Props) {
  const signIn = useAuth((s) => s.signIn);
  const [phoneInput, setPhoneInput] = useState("");
  const [phone, setPhone] = useState<string | null>(null); // set once an OTP has been requested
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wait, setWait] = useState(0);

  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  const request = async () => {
    // The field shows a +254 prefix, so accept "712345678", "0712345678" and "+254712345678".
    const raw = phoneInput.replace(/\s/g, "");
    const p = normalisePhone(/^(\+|0|254)/.test(raw) ? raw : `254${raw}`);
    if (!p) return setError("Enter a valid Kenyan number, like 0712 345 678.");
    setBusy(true);
    setError(null);
    try {
      await api.requestOtp(p);
      setPhone(p);
      setCode("");
      setWait(RESEND_SECONDS);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const verify = async (value = code) => {
    if (!phone || value.length !== 6 || busy) return;
    setBusy(true);
    setError(null);
    try {
      const session = await api.verifyOtp(phone, value);
      if (session.user.role !== "supplier") throw new Error("This number is not registered as a supplier. Contact GEKEL support.");
      await signIn(session);
    } catch (e: any) {
      setError(e.message);
      setCode("");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen
      keyboard
      header={<Header title={phone ? "Enter your code" : "Supplier sign in"} onBack={() => (phone ? setPhone(null) : navigation.goBack())} />}
      footer={
        phone ? (
          <Button label="Verify and continue" onPress={() => verify()} loading={busy} disabled={code.length !== 6} />
        ) : (
          <Button label="Send code" onPress={request} loading={busy} disabled={phoneInput.trim().length < 9} />
        )
      }
    >
      {USING_MOCK ? <Banner tone="brand">Demo mode: any Kenyan number works. The code is {MOCK_HINTS.otp}.</Banner> : null}
      {error ? <Banner tone="danger">{error}</Banner> : null}

      {phone ? (
        <View className="pt-4">
          <Text className="mb-6 text-[15px] text-ink-soft">
            We sent a 6-digit code by SMS to <Text className="font-bold text-ink">{phone}</Text>.
          </Text>
          <OtpInput value={code} onChange={setCode} length={6} autoFocus error={!!error} onComplete={verify} />
          <View className="mt-6 items-center">
            {wait > 0 ? (
              <Text className="text-[14px] text-ink-soft">Resend code in {wait}s</Text>
            ) : (
              <Pressable onPress={request} hitSlop={10}>
                <Text className="text-[14px] font-bold text-brand-600">Resend code</Text>
              </Pressable>
            )}
          </View>
        </View>
      ) : (
        <View className="pt-4">
          <Text className="mb-6 text-[15px] text-ink-soft">Use the phone number GEKEL has on file for you. We'll text you a code to confirm it's you.</Text>
          <Field
            label="Phone number"
            prefix="+254"
            placeholder="712 345 678"
            keyboardType="phone-pad"
            autoComplete="tel"
            textContentType="telephoneNumber"
            value={phoneInput}
            onChangeText={(t) => {
              setPhoneInput(t);
              setError(null);
            }}
            onSubmitEditing={request}
            returnKeyType="go"
          />
        </View>
      )}
    </Screen>
  );
}
