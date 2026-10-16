import React from "react";
import { Image } from "react-native";

const SRC = require("../assets/logo.png");

/** Gekel Finds logo. `rounded` gives it app-icon corners; turn it off on the splash so it blends into the background. */
export default function Logo({
  size = 160,
  rounded = true,
}: {
  size?: number;
  rounded?: boolean;
}) {
  return (
    <Image
      source={SRC}
      style={{
        width: size,
        height: size,
        borderRadius: rounded ? size * 0.22 : 0,
      }}
      resizeMode="contain"
      accessibilityLabel="Gekel Finds logo"
    />
  );
}
