import { CameraView, useCameraPermissions } from "expo-camera";
import { X } from "lucide-react-native";
import { useRef } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { c } from "../theme/tokens";
import { Button } from "./ui";

/** Full-screen QR / barcode scanner. Fires onScan once, then closes. */
export function CodeScanner({ visible, onClose, onScan }: { visible: boolean; onClose: () => void; onScan: (data: string) => void }) {
  const [perm, ask] = useCameraPermissions();
  const fired = useRef(false);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} onShow={() => (fired.current = false)}>
      <View className="flex-1 bg-surface">
        {perm?.granted ? (
          <CameraView
            style={{ flex: 1 }}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ["qr", "code128", "code39", "ean13"] }}
            onBarcodeScanned={({ data }) => {
              if (fired.current) return;
              fired.current = true;
              onScan(data);
            }}
          />
        ) : (
          <View className="flex-1 items-center justify-center px-8">
            <Text className="mb-2 text-center text-[18px] font-bold text-white">Camera access needed</Text>
            <Text className="mb-6 text-center text-[14px] text-sink-soft">Allow the camera to scan the seal code on the parcel.</Text>
            <Button label="Allow camera" onPress={() => void ask()} />
          </View>
        )}
        <View pointerEvents="none" className="absolute inset-0 items-center justify-center">
          <View className="h-60 w-60 rounded-3xl border-2 border-white-80" />
          <Text className="mt-4 text-[14px] font-semibold text-white">Align the seal code inside the frame</Text>
        </View>
        <Pressable onPress={onClose} accessibilityLabel="Close scanner" className="absolute right-4 top-14 h-11 w-11 items-center justify-center rounded-full bg-black-55">
          <X size={22} color={c.white} />
        </Pressable>
      </View>
    </Modal>
  );
}
