import * as ImagePicker from "expo-image-picker";
import { Camera, ImagePlus, RefreshCw } from "lucide-react-native";
import { useState } from "react";
import { ActionSheetIOS, Alert, Image, Platform, Pressable, Text, View } from "react-native";
import { c } from "../theme/tokens";

interface Props {
  value?: string;
  onChange: (uri: string) => void;
  label?: string;
  hint?: string;
  /** "camera" forces a live capture (proof photos). "any" lets the user pick from the library too. */
  source?: "camera" | "any";
  aspect?: number;
  error?: string | null;
}

async function fromCamera(): Promise<string | null> {
  const perm = await ImagePicker.requestCameraPermissionsAsync();
  if (!perm.granted) {
    Alert.alert("Camera access needed", "Allow camera access in Settings to take this photo.");
    return null;
  }
  const r = await ImagePicker.launchCameraAsync({ quality: 0.7, allowsEditing: false });
  return r.canceled ? null : r.assets[0].uri;
}

async function fromLibrary(): Promise<string | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) {
    Alert.alert("Photo access needed", "Allow photo access in Settings to choose a picture.");
    return null;
  }
  const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.7 });
  return r.canceled ? null : r.assets[0].uri;
}

export function PhotoField({ value, onChange, label, hint, source = "any", aspect = 4 / 3, error }: Props) {
  const [busy, setBusy] = useState(false);

  const pick = async (kind: "camera" | "library") => {
    setBusy(true);
    try {
      const uri = kind === "camera" ? await fromCamera() : await fromLibrary();
      if (uri) onChange(uri);
    } finally {
      setBusy(false);
    }
  };

  const open = () => {
    if (source === "camera") return void pick("camera");
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions({ options: ["Cancel", "Take photo", "Choose from library"], cancelButtonIndex: 0 }, (i) => {
        if (i === 1) void pick("camera");
        if (i === 2) void pick("library");
      });
    } else {
      Alert.alert("Add photo", undefined, [
        { text: "Take photo", onPress: () => void pick("camera") },
        { text: "Choose from library", onPress: () => void pick("library") },
        { text: "Cancel", style: "cancel" },
      ]);
    }
  };

  return (
    <View className="mb-4">
      {label ? <Text className="mb-1.5 text-[13px] font-semibold text-ink">{label}</Text> : null}
      <Pressable
        onPress={open}
        disabled={busy}
        accessibilityRole="button"
        accessibilityLabel={value ? "Retake photo" : "Add photo"}
        style={{ aspectRatio: aspect }}
        className={`w-full overflow-hidden rounded-2xl border ${error ? "border-danger" : value ? "border-line" : "border-dashed border-ink-mute"} bg-white`}
      >
        {value ? (
          <>
            <Image source={{ uri: value }} className="h-full w-full" resizeMode="cover" />
            <View className="absolute bottom-3 right-3 flex-row items-center rounded-full bg-black-60 px-3 py-1.5">
              <RefreshCw size={14} color={c.white} />
              <Text className="ml-1.5 text-[12px] font-semibold text-white">Retake</Text>
            </View>
          </>
        ) : (
          <View className="flex-1 items-center justify-center">
            <View className="h-12 w-12 items-center justify-center rounded-full bg-brand-50">
              {source === "camera" ? <Camera size={22} color={c.brand600} /> : <ImagePlus size={22} color={c.brand600} />}
            </View>
            <Text className="mt-2 text-[14px] font-semibold text-ink">{source === "camera" ? "Take photo" : "Add photo"}</Text>
            {hint ? <Text className="mt-0.5 px-6 text-center text-[12px] text-ink-soft">{hint}</Text> : null}
          </View>
        )}
      </Pressable>
      {error ? <Text className="mt-1 text-[12px] text-danger">{error}</Text> : null}
    </View>
  );
}
