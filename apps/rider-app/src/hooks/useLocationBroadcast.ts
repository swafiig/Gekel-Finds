import * as Location from "expo-location";
import { useEffect } from "react";
import { api } from "../lib/api";

/**
 * While `active`, streams the rider's position to the API every ~10s so the buyer's
 * tracking screen can move the pin. Silently does nothing if permission is denied.
 */
export function useLocationBroadcast(active: boolean, deliveryId?: string) {
  useEffect(() => {
    if (!active) return;
    let sub: Location.LocationSubscription | null = null;
    let cancelled = false;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted" || cancelled) return;
      sub = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 10_000, distanceInterval: 15 },
        (loc) => {
          api.sendLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude }, deliveryId).catch(() => {});
        },
      );
      if (cancelled) sub.remove();
    })();
    return () => {
      cancelled = true;
      sub?.remove();
    };
  }, [active, deliveryId]);
}
