import { Check } from "lucide-react-native";
import { Text, View } from "react-native";
import { c } from "../theme/tokens";

export interface Step {
  label: string;
  detail?: string;
}

/** Vertical stepper. `current` is the index of the active step; earlier steps are done. */
export function Timeline({ steps, current }: { steps: Step[]; current: number }) {
  return (
    <View>
      {steps.map((s, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <View key={s.label} className="flex-row">
            <View className="items-center" style={{ width: 28 }}>
              <View className={`h-6 w-6 items-center justify-center rounded-full ${done ? "bg-success" : active ? "bg-brand-500" : "border border-line bg-white"}`}>
                {done ? <Check size={14} color={c.white} /> : <Text className={`text-[11px] font-bold ${active ? "text-white" : "text-ink-mute"}`}>{i + 1}</Text>}
              </View>
              {i < steps.length - 1 ? <View className={`my-1 w-0.5 flex-1 ${done ? "bg-success" : "bg-line"}`} style={{ minHeight: 18 }} /> : null}
            </View>
            <View className="ml-3 flex-1 pb-4">
              <Text className={`text-[15px] ${active ? "font-bold text-ink" : done ? "font-semibold text-ink" : "font-medium text-ink-mute"}`}>{s.label}</Text>
              {s.detail && (active || done) ? <Text className="mt-0.5 text-[13px] text-ink-soft">{s.detail}</Text> : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}
