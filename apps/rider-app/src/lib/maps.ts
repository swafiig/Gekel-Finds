import { Alert, Linking } from "react-native";
import type { GeoPoint } from "./api";

/** Opens turn-by-turn directions in whatever maps app the phone prefers. */
export function openDirections(to: GeoPoint, label?: string) {
  const url = `https://www.google.com/maps/dir/?api=1&destination=${to.lat},${to.lng}&travelmode=driving`;
  Linking.openURL(url).catch(() => Alert.alert("Couldn't open Maps", label ? `Navigate to ${label} manually.` : "Open your maps app and navigate manually."));
}

export function callNumber(phone?: string) {
  if (!phone) return Alert.alert("No phone number", "This contact has no number on file.");
  Linking.openURL(`tel:${phone}`).catch(() => Alert.alert("Couldn't start the call"));
}
