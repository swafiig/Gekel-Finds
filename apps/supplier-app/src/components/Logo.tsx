import { Image, View } from "react-native";

const white = require("../../assets/mark-white.png");
const brand = require("../../assets/mark-brand.png");

/** The GEKEL mark. `white` for brand/dark backgrounds, `brand` for light ones. */
export function Logo({ size = 32, tone = "brand" }: { size?: number; tone?: "white" | "brand" }) {
  return (
    <View style={{ width: size, height: size }}>
      <Image source={tone === "white" ? white : brand} style={{ width: size, height: size }} resizeMode="contain" accessibilityLabel="GEKEL" />
    </View>
  );
}
