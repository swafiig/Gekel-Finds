import { AlertCircle, ArrowLeft, ImageIcon, Inbox, LucideIcon, RefreshCw } from "lucide-react-native";
import { ReactNode } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TextInputProps,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { c } from "../theme/tokens";

/* ---------- Screen & header ---------- */

interface ScreenProps {
  children: ReactNode;
  scroll?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  /** Sticky area under the content (primary action bar). */
  footer?: ReactNode;
  header?: ReactNode;
  padded?: boolean;
  keyboard?: boolean;
}

export function Screen({ children, scroll = true, refreshing, onRefresh, footer, header, padded = true, keyboard }: ScreenProps) {
  const insets = useSafeAreaInsets();
  const body = scroll ? (
    <ScrollView
      className="flex-1"
      contentContainerStyle={{ paddingHorizontal: padded ? 16 : 0, paddingTop: 8, paddingBottom: 24 }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      refreshControl={onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={c.brand} colors={[c.brand]} /> : undefined}
    >
      {children}
    </ScrollView>
  ) : (
    <View className={`flex-1 ${padded ? "px-4" : ""}`}>{children}</View>
  );
  const content = (
    <View className="flex-1 bg-cream" style={{ paddingTop: header ? 0 : insets.top }}>
      {header}
      {body}
      {footer ? (
        <View className="border-t border-line bg-white px-4 pt-3" style={{ paddingBottom: Math.max(insets.bottom, 12) }}>
          {footer}
        </View>
      ) : null}
    </View>
  );
  return keyboard ? (
    <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === "ios" ? "padding" : undefined}>
      {content}
    </KeyboardAvoidingView>
  ) : (
    content
  );
}

interface HeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: ReactNode;
  left?: ReactNode;
}

export function Header({ title, subtitle, onBack, right, left }: HeaderProps) {
  const insets = useSafeAreaInsets();
  return (
    <View className="bg-cream px-4 pb-3" style={{ paddingTop: insets.top + 8 }}>
      <View className="min-h-[44px] flex-row items-center">
        {onBack ? (
          <Pressable onPress={onBack} hitSlop={12} accessibilityRole="button" accessibilityLabel="Back" className="-ml-2 mr-1 h-11 w-11 items-center justify-center">
            <ArrowLeft size={22} color={c.ink} />
          </Pressable>
        ) : left ? (
          <View className="mr-3">{left}</View>
        ) : null}
        <View className="flex-1">
          <Text className="text-[20px] font-bold text-ink" numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text className="text-[13px] text-ink-soft" numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {right}
      </View>
    </View>
  );
}

export function IconButton({ icon: Icon, onPress, label, badge, tone = "light" }: { icon: LucideIcon; onPress: () => void; label: string; badge?: boolean; tone?: "light" | "dark" }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      className={`h-11 w-11 items-center justify-center rounded-full ${tone === "light" ? "border border-line bg-white" : "bg-white-15"}`}
    >
      <Icon size={20} color={tone === "light" ? c.ink : c.white} />
      {badge ? <View className="absolute right-2.5 top-2.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-brand-500" /> : null}
    </Pressable>
  );
}

/* ---------- Surfaces ---------- */

export function Card({ children, className = "", onPress }: { children: ReactNode; className?: string; onPress?: () => void }) {
  const cls = `rounded-2xl border border-line bg-white p-4 ${className}`;
  if (onPress) {
    return (
      <Pressable onPress={onPress} accessibilityRole="button" className={`${cls} active:bg-cream`}>
        {children}
      </Pressable>
    );
  }
  return <View className={cls}>{children}</View>;
}

export function SectionTitle({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View className="mb-2 mt-5 flex-row items-end justify-between">
      <Text className="text-[13px] font-semibold uppercase tracking-wider text-ink-soft">{title}</Text>
      {action ? (
        <Pressable onPress={onAction} hitSlop={10}>
          <Text className="text-[13px] font-semibold text-brand-600">{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function Divider() {
  return <View className="my-3 h-px bg-line" />;
}

export function Row({ label, value, strong, mono }: { label: string; value: string; strong?: boolean; mono?: boolean }) {
  return (
    <View className="flex-row items-center justify-between py-1">
      <Text className="text-[14px] text-ink-soft">{label}</Text>
      <Text className={`text-[14px] ${strong ? "font-bold text-ink" : "font-medium text-ink"} ${mono ? "tracking-wider" : ""}`}>{value}</Text>
    </View>
  );
}

/* ---------- Status ---------- */

export type Tone = "success" | "brand" | "neutral" | "danger" | "dark";
const toneBox: Record<Tone, string> = {
  success: "bg-success/10",
  brand: "bg-brand-50",
  neutral: "bg-sink",
  danger: "bg-danger/10",
  dark: "bg-ink",
};
const toneText: Record<Tone, string> = {
  success: "text-success",
  brand: "text-brand-700",
  neutral: "text-ink-soft",
  danger: "text-danger",
  dark: "text-white",
};
const toneDot: Record<Tone, string> = {
  success: "bg-success",
  brand: "bg-brand-500",
  neutral: "bg-ink-mute",
  danger: "bg-danger",
  dark: "bg-white",
};

export function Pill({ label, tone = "neutral", dot = true }: { label: string; tone?: Tone; dot?: boolean }) {
  return (
    <View className={`flex-row items-center self-start rounded-full px-2.5 py-1 ${toneBox[tone]}`}>
      {dot ? <View className={`mr-1.5 h-1.5 w-1.5 rounded-full ${toneDot[tone]}`} /> : null}
      <Text className={`text-[11px] font-bold uppercase tracking-wide ${toneText[tone]}`}>{label}</Text>
    </View>
  );
}

/* ---------- Buttons ---------- */

type Variant = "primary" | "dark" | "outline" | "ghost" | "danger";
const btnBox: Record<Variant, string> = {
  primary: "bg-brand-500 active:bg-brand-600",
  dark: "bg-ink active:bg-surface-soft",
  outline: "bg-white border border-line active:bg-cream",
  ghost: "active:bg-sink",
  danger: "bg-white border border-danger active:bg-danger/10",
};
const btnText: Record<Variant, string> = {
  primary: "text-white",
  dark: "text-white",
  outline: "text-ink",
  ghost: "text-brand-600",
  danger: "text-danger",
};

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  icon?: LucideIcon;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  small?: boolean;
}

export function Button({ label, onPress, variant = "primary", icon: Icon, loading, disabled, className = "", small }: ButtonProps) {
  const off = disabled || loading;
  const color = variant === "primary" || variant === "dark" ? c.white : variant === "danger" ? c.danger : variant === "ghost" ? c.brand600 : c.ink;
  return (
    <Pressable
      onPress={onPress}
      disabled={off}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!off, busy: !!loading }}
      className={`flex-row items-center justify-center rounded-xl ${small ? "h-11 px-4" : "h-14 px-5"} ${btnBox[variant]} ${off ? "opacity-50" : ""} ${className}`}
    >
      {loading ? <ActivityIndicator color={color} /> : Icon ? <Icon size={18} color={color} /> : null}
      {!loading ? <Text className={`${Icon ? "ml-2" : ""} ${small ? "text-[14px]" : "text-[16px]"} font-bold ${btnText[variant]}`}>{label}</Text> : null}
    </Pressable>
  );
}

/* ---------- Inputs ---------- */

interface FieldProps extends TextInputProps {
  label?: string;
  error?: string | null;
  hint?: string;
  prefix?: string;
  suffix?: string;
}

export function Field({ label, error, hint, prefix, suffix, className = "", ...rest }: FieldProps) {
  return (
    <View className={`mb-4 ${className}`}>
      {label ? <Text className="mb-1.5 text-[13px] font-semibold text-ink">{label}</Text> : null}
      <View className={`flex-row rounded-xl border bg-white px-3 ${rest.multiline ? "min-h-[88px] items-start py-2" : "h-12 items-center"} ${error ? "border-danger" : "border-line"}`}>
        {prefix ? <Text className="mr-2 text-[15px] font-medium text-ink-soft">{prefix}</Text> : null}
        <TextInput
          placeholderTextColor={c.inkMute}
          selectionColor={c.brand}
          className={`flex-1 text-[16px] text-ink ${rest.multiline ? "min-h-[72px]" : "h-full"}`}
          textAlignVertical={rest.multiline ? "top" : "center"}
          accessibilityLabel={label}
          {...rest}
        />
        {suffix ? <Text className="ml-2 text-[14px] text-ink-soft">{suffix}</Text> : null}
      </View>
      {error ? <Text className="mt-1 text-[12px] text-danger">{error}</Text> : hint ? <Text className="mt-1 text-[12px] text-ink-soft">{hint}</Text> : null}
    </View>
  );
}

export function Chips<T extends string>({ options, value, onChange, counts }: { options: Array<{ key: T; label: string }>; value: T; onChange: (k: T) => void; counts?: Partial<Record<T, number>> }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 16 }} className="mb-3 -mx-4 px-4 grow-0">
      {options.map((o) => {
        const on = o.key === value;
        const n = counts?.[o.key];
        return (
          <Pressable
            key={o.key}
            onPress={() => onChange(o.key)}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            className={`mr-2 h-10 flex-row items-center rounded-full border px-4 ${on ? "border-ink bg-ink" : "border-line bg-white"}`}
          >
            <Text className={`text-[14px] font-semibold ${on ? "text-white" : "text-ink"}`}>{o.label}</Text>
            {n !== undefined ? (
              <View className={`ml-2 min-w-[20px] items-center rounded-full px-1.5 ${on ? "bg-white-20" : "bg-sink"}`}>
                <Text className={`text-[12px] font-bold ${on ? "text-white" : "text-ink-soft"}`}>{n}</Text>
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

/* ---------- Media ---------- */

export function Thumb({ uri, size = 56, icon: Icon = ImageIcon }: { uri?: string; size?: number; icon?: LucideIcon }) {
  return uri ? (
    <Image source={{ uri }} style={{ width: size, height: size }} className="rounded-xl bg-sink" />
  ) : (
    <View style={{ width: size, height: size }} className="items-center justify-center rounded-xl bg-sink">
      <Icon size={size * 0.38} color={c.inkMute} />
    </View>
  );
}

/* ---------- States ---------- */

export function Loading({ label }: { label?: string }) {
  return (
    <View className="items-center justify-center py-16">
      <ActivityIndicator color={c.brand} />
      {label ? <Text className="mt-3 text-[13px] text-ink-soft">{label}</Text> : null}
    </View>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <View className="items-center px-6 py-14">
      <View className="h-12 w-12 items-center justify-center rounded-full bg-danger/10">
        <AlertCircle size={24} color={c.danger} />
      </View>
      <Text className="mt-4 text-center text-[16px] font-bold text-ink">Couldn't load this</Text>
      <Text className="mt-1 text-center text-[14px] text-ink-soft">{message}</Text>
      {onRetry ? (
        <View className="mt-5">
          <Button label="Try again" icon={RefreshCw} variant="outline" small onPress={onRetry} />
        </View>
      ) : null}
    </View>
  );
}

export function Empty({ title, body, icon: Icon = Inbox, action }: { title: string; body?: string; icon?: LucideIcon; action?: ReactNode }) {
  return (
    <View className="items-center px-6 py-14">
      <View className="h-12 w-12 items-center justify-center rounded-full bg-sink">
        <Icon size={24} color={c.inkSoft} />
      </View>
      <Text className="mt-4 text-center text-[16px] font-bold text-ink">{title}</Text>
      {body ? <Text className="mt-1 text-center text-[14px] text-ink-soft">{body}</Text> : null}
      {action ? <View className="mt-5">{action}</View> : null}
    </View>
  );
}

export function Banner({ tone = "neutral", children }: { tone?: "neutral" | "danger" | "success" | "brand"; children: ReactNode }) {
  const box = { neutral: "bg-sink", danger: "bg-danger/10", success: "bg-success/10", brand: "bg-brand-50" }[tone];
  const text = { neutral: "text-ink-soft", danger: "text-danger", success: "text-success", brand: "text-brand-700" }[tone];
  return (
    <View className={`mb-3 rounded-xl px-3 py-2.5 ${box}`}>
      <Text className={`text-[13px] font-medium ${text}`}>{children}</Text>
    </View>
  );
}

/** Wraps a query's loading/error/empty states so screens stay short. */
export function QueryBoundary({ loading, error, onRetry, children, label }: { loading: boolean; error: string | null; onRetry: () => void; children: ReactNode; label?: string }) {
  if (loading) return <Loading label={label} />;
  if (error) return <ErrorState message={error} onRetry={onRetry} />;
  return <>{children}</>;
}
