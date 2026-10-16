import React, { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import MapView, { Region } from "react-native-maps";
import * as Location from "expo-location";
import { SafeAreaView } from "react-native-safe-area-context";
import { RouteProp, useRoute } from "@react-navigation/native";
import Button from "../../components/Button";
import { useNav } from "../../hooks/useNav";
import type { RootStackParamList } from "../../types/navigation";

const NAIROBI = { latitude: -1.2864, longitude: 36.8172 };

/** Drag the map under the fixed pin, then confirm. Returns the coordinates to the address form. */
export default function MapPickerScreen() {
  const nav = useNav();
  const { lat, lng } =
    useRoute<RouteProp<RootStackParamList, "MapPicker">>().params ?? {};
  const start: Region = {
    latitude: lat ?? NAIROBI.latitude,
    longitude: lng ?? NAIROBI.longitude,
    latitudeDelta: 0.02,
    longitudeDelta: 0.02,
  };
  const [region, setRegion] = useState(start);
  const mapRef = React.useRef<MapView>(null);

  const recenter = async () => {
    const perm = await Location.requestForegroundPermissionsAsync();
    if (!perm.granted) return;
    const p = await Location.getCurrentPositionAsync({});
    mapRef.current?.animateToRegion(
      {
        latitude: p.coords.latitude,
        longitude: p.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      },
      400,
    );
  };

  const confirm = () =>
    nav.navigate({
      name: "AddressForm",
      params: { pin: { lat: region.latitude, lng: region.longitude } },
      merge: true,
    } as never);

  return (
    <View className="flex-1 bg-white">
      <MapView
        ref={mapRef}
        style={{ flex: 1 }}
        initialRegion={start}
        onRegionChangeComplete={setRegion}
        showsUserLocation
        showsMyLocationButton={false}
      />
      <View
        pointerEvents="none"
        className="absolute inset-0 items-center justify-center"
      >
        <Ionicons
          name="location"
          size={46}
          color="#FA3504"
          style={{ marginBottom: 46 }}
        />
      </View>
      <SafeAreaView edges={["top"]} className="absolute left-0 right-0 top-0">
        <View className="flex-row items-center px-4 pt-2">
          <Pressable
            onPress={() => nav.goBack()}
            accessibilityLabel="Go back"
            className="h-11 w-11 items-center justify-center rounded-full bg-white shadow"
          >
            <Ionicons name="arrow-back" size={20} color={ic.primary} />
          </Pressable>
          <View className="ml-3 flex-1 rounded-full bg-white px-4 py-2.5 shadow">
            <Text className="text-sm font-semibold text-ink">
              Move the map to your exact door
            </Text>
          </View>
        </View>
      </SafeAreaView>
      <Pressable
        onPress={recenter}
        accessibilityLabel="My location"
        className="absolute right-4 h-12 w-12 items-center justify-center rounded-full bg-white shadow"
        style={{ bottom: 120 }}
      >
        <Ionicons name="locate" size={22} color="#FA3504" />
      </Pressable>
      <SafeAreaView
        edges={["bottom"]}
        className="absolute bottom-0 left-0 right-0 bg-white px-5 pb-3 pt-4"
      >
        <Text className="mb-3 text-center text-xs text-ink-soft">
          {region.latitude.toFixed(5)}, {region.longitude.toFixed(5)}
        </Text>
        <Button title="Confirm this spot" onPress={confirm} />
      </SafeAreaView>
    </View>
  );
}
